<?php

namespace App\Http\Controllers;

use App\Jobs\DriveFOlderUpload;
use App\Models\DocumentFolder;
use Illuminate\Http\Request;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Models\Documents;
use App\Models\DocumentVersions;
use App\Models\GoogleTokens;
use App\Repositories\Contracts\DocumentMetaDataRepositoryInterface;
use App\Repositories\Contracts\DocumentTokenRepositoryInterface;
use App\Repositories\Contracts\UserNotificationRepositoryInterface;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Http;
use Pion\Laravel\ChunkUpload\Receiver\FileReceiver;
use Pion\Laravel\ChunkUpload\Handler\HandlerFactory;

class DocumentController extends Controller
{
    private $documentRepository;
    private  $documentMetaDataRepository;
    private $documenTokenRepository;
    private $userNotificationRepository;
    protected $queryString;
    protected $client;
    protected $folder_id;
    protected $service;
    protected $refreshToken;

    public function __construct(
        DocumentRepositoryInterface $documentRepository,
        DocumentMetaDataRepositoryInterface $documentMetaDataRepository,
        UserNotificationRepositoryInterface $userNotificationRepository,
        DocumentTokenRepositoryInterface $documenTokenRepository
    ) {
        $this->documentRepository = $documentRepository;
        $this->documentMetaDataRepository = $documentMetaDataRepository;
        $this->userNotificationRepository = $userNotificationRepository;
        $this->documenTokenRepository = $documenTokenRepository;

        $tokens = GoogleTokens::get();

        if (!empty($tokens) && isset($tokens)) {
           $newRefreshToken = GoogleTokens::where('name','drive_refresh_token')->first();
           if (!isset($newRefreshToken)) {
                $newRefreshToken = GoogleTokens::create([
                     'name' => 'drive_refresh_token',
                     'value' => env('GOOGLE_DRIVE_REFRESH_TOKEN')
                 ]);
           }
        }

        $this->client = new \Google_Client();
        $this->client->setClientId(env('GOOGLE_DRIVE_CLIENT_ID'));
        $this->client->setClientSecret(env('GOOGLE_DRIVE_CLIENT_SECRET'));
        $this->client->setRedirectUri(url('api/google-drive-callback'));
        $this->client->setAccessType('offline');
        $this->client->setApprovalPrompt("force");

        // if ($this->client->isAccessTokenExpired()) {
        //     // Try refreshing with the refresh token
        //     $refreshToken = $this->client->getRefreshToken();
        //     if ($refreshToken) {
        //         $this->client->fetchAccessTokenWithRefreshToken($refreshToken);
        //         $this->refreshToken = $this->client->getAccessToken();
        //     } else {

        //     }
        // }
        $this->refreshAccessToken($newRefreshToken->value);
        $this->service = new \Google\Service\Drive($this->client);
    }

    public function refreshAccessToken($refreshToken)
    {
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post('https://www.googleapis.com/oauth2/v4/token', [
                'client_id' => env('GOOGLE_DRIVE_CLIENT_ID'),     // Make sure to set this in your .env file
                'client_secret' => env('GOOGLE_DRIVE_CLIENT_SECRET'), // Set this in your .env file
                'refresh_token' => $refreshToken,
                'grant_type' => 'refresh_token',
            ]);

        if ($response->successful()) {
            $data = $response->json();
            GoogleTokens::where('name','drive_refresh_token')->update(['value' => $data['access_token']]);
            $this->client->refreshToken($data['access_token']);
            return $data['access_token'];
        } else {
            // Handle error, you can log or return as necessary
            return response()->json(['error' => 'Failed to refresh access token.'], 500);
        }
    }

    public function getDocuments(Request $request)
    {
        $queryString = (object) $request->all();

        $count = $this->documentRepository->getDocumentsCount($queryString);
        return response()->json($this->documentRepository->getDocuments($queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $queryString->pageSize, 'skip' => $queryString->skip]);
    }

    public function officeviewer(Request $request, $id)
    {
        $isTokenAvailable = $this->documenTokenRepository->getDocumentPathByToken($id, $request);

        if ($isTokenAvailable == false) {
            return response()->json([
                'message' => 'Document Not Found.',
            ], 404);
        }
        return $this->downloadDocument($id, $request->input('isVersion'));
    }


    public function downloadDocument($id, $isVersion)
    {
        $bool = filter_var($isVersion, FILTER_VALIDATE_BOOLEAN);
        if ($bool == true) {
            $file = DocumentVersions::findOrFail($id);
        } else {
            $file = Documents::findOrFail($id);
        }

        $fileId = $file->url;

        $response = $this->service->files->get($fileId, array(
            'alt' => 'media'));
        $content = $response->getBody()->getContents();
        return $content;

    }

    public function readTextDocument($id, $isVersion)
    {
        $bool = filter_var($isVersion, FILTER_VALIDATE_BOOLEAN);
        if ($bool == true) {
            $file = DocumentVersions::findOrFail($id);
        } else {
            $file = Documents::findOrFail($id);
        }

        $fileupload = $file->url;

        if (Storage::disk('local')->exists($fileupload)) {
            $file_contents = Storage::disk('local')->get($fileupload);
            $response = ["result" => [$file_contents]];
            return response($response);
        }
    }

    public function fileUpload()
    {
        return view('fileUpload');
    }

    public function saveDocument(Request $request)
    {

        // if (isset($request->type)) {
        //     $receiver = new FileReceiver('file', $request, HandlerFactory::classFromRequest($request));
        // }else{
            $receiver = new FileReceiver('file', $request, HandlerFactory::classFromRequest($request));
        // }

        $fileReceived = $receiver->receive(); // receive file

        if ($fileReceived->isFinished()) { // file uploading is complete / all chunks are uploaded

            if (isset($request->type)) {

                $request['path'] = $request->resumableRelativePath;
                $request['categoryId'] = "ecf8300c-f027-4cfa-98ab-bcb6c705f476";
                $request['categoryName'] = "";
                $request['description'] = "";
                $request['documentMetaDatas'] = "[]";
                $request['documentRolePermissions'] = "[]";
                $request['documentUserPermissions'] = "[]";

                $realPath = $request['path'];
                $filePath = explode("/",$realPath);
                $request['name'] = end($filePath);

                $i = 0;

                function folderId($filePath,$folderId,$i){
                    $folder = DocumentFolder::where('parent_id',$folderId)->where('name',$filePath[$i])->first();
                    if (isset($folder)) {
                        if (strpos($filePath[$i + 1], '.')) {
                            return $folder->id;
                        }else {
                            $i++;
                            return folderId($filePath,$folder->id,$i);
                        }
                    }else{
                        if (isset($filePath[$i])) {
                            $createFolder = DocumentFolder::create([
                                'name' => $filePath[$i],
                                'parent_id'=> $folderId,
                            ]);
                            if (strpos($filePath[$i + 1], '.')) {
                                return $createFolder->id;
                            } else {
                                $i++;
                                return folderId($filePath,$createFolder->id,$i);
                            }
                        }
                    }
                }

                if ($request->type == "folder") {
                    if (isset($request->id)) {
                        $request['folder_id'] = folderId($filePath,$request->id,$i);
                    }else{
                        $request['folder_id'] = folderId($filePath,null,$i);
                    }
                }else{
                    $request['folder_id'] = isset($request->id) ? $request->id : null;
                }

                $checkFile = Documents::where('folder_id',$request['folder_id'])->where('name',$request['name'])->first();

                if (isset($checkFile)) {
                    return response()->json(['error'=>'File already exists'],500);
                }

                array_pop($filePath);

                $drivePath = implode("/",$filePath)."/".Uuid::uuid4().$request['name'];


            }else{
                $validator = Validator::make($request->all(), [
                    'name'       => ['required'],
                ]);

                if ($validator->fails()) {
                    return response()->json($validator->messages(), 409);
                }

                $drivePath = Uuid::uuid4().$request->name;
            }

            $file = $fileReceived->getFile(); // get file

            $fileMetadata = new DriveFile(array('name' => $drivePath));
            $content = file_get_contents($file);
            // dd($this->refreshToken);
            $driveFile = $this->service->files->create($fileMetadata, array(
                'data' => $content,
                'mimeType' => $file->getClientMimeType(),
                'uploadType' => 'multipart',
                'fields' => 'id'));

            $path = $driveFile->id;

            unlink($file->getPathname());

            return $this->documentRepository->saveDocument($request, $path);
        }

    }

    public function updateDocument(Request $request, $id)
    {
        if (isset($request->folder_id)) {
            $model = Documents::where([['name', '=', $request->name],['folder_id', '=', $request->folder_id], ['id', '<>', $id]])->first();
        }else{
            $model = Documents::where([['name', '=', $request->name], ['id', '<>', $id]])->first();
        }

        if (!is_null($model)) {
            return response()->json([
                'message' => 'Document already exist.',
            ], 409);
        }
        return  response()->json($this->documentRepository->updateDocument($request, $id), 200);
    }

    public function deleteDocument($id)
    {
        $data = Documents::find($id);

        $this->service->files->delete($data->url, array('supportsAllDrives' => true));

        return response($this->documentRepository->delete($id), 204);
    }

    public function getDocumentMetatags($id)
    {
        return  response($this->documentMetaDataRepository->getDocumentMetadatas($id), 200);
    }

    public function assignedDocuments(Request $request)
    {
        $queryString = (object) $request->all();

        $count = $this->documentRepository->assignedDocumentsCount($queryString);
        return response()->json($this->documentRepository->assignedDocuments($queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $queryString->pageSize, 'skip' => $queryString->skip]);
    }

    public function getDocumentsByCategoryQuery()
    {
        return response()->json($this->documentRepository->getDocumentByCategory());
    }

    public function getDocumentbyId($id)
    {
        $this->userNotificationRepository->markAsReadByDocumentId($id);
        return response()->json($this->documentRepository->getDocumentbyId($id));
    }

    public function folderPath(Request $request){

        $id = $request->id;

        $pathArray = [];

        if ($id) {
            function allPath($i,$pathArray){
                $folders = DocumentFolder::find($i);
                array_push($pathArray,['name' => $folders->name,'path' => (string)$i]);
                if ($folders->parent_id) {
                    return allPath($folders->parent_id,$pathArray);
                }else{
                    return $pathArray;
                }
            }
            $newArray = array_reverse(allPath($id,$pathArray));

            array_unshift($newArray,['name'=>'home','path' => 'home']);

            return response()->json($newArray,200);

        }else{
            return response()->json(['name'=>'home','path' => 'home'],200);
        }

    }

    public function renameFolder(Request $request, $id){

        $validator = Validator::make($request->all(), [
            'name' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->messages(), 403);
        }

        $folders = DocumentFolder::find($id)->update([
            'name' => $request->name
        ]);

        return response()->json(['success'=>'Folder Rename Successfully'], 200);
    }

    public function deleteFolder(Request $request,$id){
        try {
            DocumentFolder::find($id)->delete();
            DocumentFolder::where('parent_id',$id)->delete();
            $documents = Documents::where('folder_id',$id)->get();

            foreach ($documents as $key => $value) {
                $this->service->files->delete($value->url, array('supportsAllDrives' => true));
            }

            Documents::where('folder_id',$id)->delete();
            return response()->json(['success'=>'Folder Deleted Successfully'], 200);

        } catch (\Exception $e) {
            return response()->json($e, 403);
        }
    }

}
