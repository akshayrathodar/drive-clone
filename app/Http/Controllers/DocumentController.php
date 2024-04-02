<?php

namespace App\Http\Controllers;

use App\Models\DocumentFolder;
use Illuminate\Http\Request;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Models\Documents;
use App\Models\DocumentVersions;
use App\Repositories\Contracts\DocumentMetaDataRepositoryInterface;
use App\Repositories\Contracts\DocumentTokenRepositoryInterface;
use App\Repositories\Contracts\UserNotificationRepositoryInterface;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;
use Yaza\LaravelGoogleDriveStorage\Gdrive;

class DocumentController extends Controller
{
    private $documentRepository;
    private  $documentMetaDataRepository;
    private $documenTokenRepository;
    private $userNotificationRepository;
    protected $queryString;

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

        $fileupload = $file->url;

        $data = Gdrive::get($fileupload);
        return response($data->file, 200)
            ->header('Content-Type', $data->ext)
            ->header('Content-disposition', 'attachment; filename="'.$data->filename.'"');

        // if (Storage::disk('local')->exists($fileupload)) {
        //     $file_contents = Storage::disk('local')->get($fileupload);
        //     $fileType = Storage::mimeType($fileupload);

        //     $fileExtension = explode('.', $file->url);
        //     return response($file_contents)
        //         ->header('Cache-Control', 'no-cache private')
        //         ->header('Content-Description', 'File Transfer')
        //         ->header('Content-Type', $fileType)
        //         ->header('Content-length', strlen($file_contents))
        //         ->header('Content-Disposition', 'attachment; filename=' . $file->name . '.' . $fileExtension[1])
        //         ->header('Content-Transfer-Encoding', 'binary');
        // }
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
        $validator = Validator::make($request->all(), [
            'name'       => ['required'],
        ]);

        if ($validator->fails()) {
            return response()->json($validator->messages(), 409);
        }

        if (isset($request->type) && $request->type == "folder") {


            if (isset($request->id)) {

                $createFolder = DocumentFolder::create([
                    'name' => $request->name,
                    'parent_id' => $request->id
                ]);

                $request['folder_id'] = $createFolder->id;
                // $request['folder_id'] = "5";

                $pathArray = [];

                function allPath($i,$pathArray){
                    $folders = DocumentFolder::find($i);
                    array_push($pathArray,$folders->name);
                    if ($folders->parent_id) {
                        return allPath($folders->parent_id,$pathArray);
                    }else{
                        return $pathArray;
                    }
                }

                $newPath = implode("/",array_reverse(allPath($request['folder_id'],$pathArray)));

                for($i=0; $i < count($request->file()) ; $i++) {

                    $path = $newPath.'/'.$request->input('path_'.$i);
                    Gdrive::put($request->input('path_'.$i), $request->file('files_'.$i));

                    $this->documentRepository->saveDocument($request, $path);
                }

            }else{

                $createFolder = DocumentFolder::create([
                    'name' => $request->name,
                ]);

                $request['folder_id'] = $createFolder->id;

                Gdrive::makeDir($request->name);

                for($i=0; $i < count($request->file()) ; $i++) {

                    $path = $request->input('path_'.$i);
                    Gdrive::put($request->input('path_'.$i), $request->file('files_'.$i));

                    $this->documentRepository->saveDocument($request, $path);
                }
            }


        }else{
            $path = Uuid::uuid4().$request->name;
            Gdrive::put($path, $request->file('uploadFile'));
            return $this->documentRepository->saveDocument($request, $path);
        }


    }

    public function updateDocument(Request $request, $id)
    {
        $model = Documents::where([['name', '=', $request->name], ['id', '<>', $id]])->first();

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
        Gdrive::delete($data->url);

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

    // public function viewDocument($id){
    //     $data = Documents::find($id);
    //     $readStream = Gdrive::readStream($data->url);

    //     return response()->stream(function () use ($readStream) {
    //         fpassthru($readStream->file);
    //     }, 200, [
    //         'Content-Type' => $readStream->ext,
    //     ]);
    // }

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
            return $pathArray;
        }


    }
}