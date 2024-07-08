<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Repositories\Contracts\DocumentVersionsRepositoryInterface;
use Ramsey\Uuid\Uuid;
use Google\Service\Drive\DriveFile;
use Pion\Laravel\ChunkUpload\Receiver\FileReceiver;
use Pion\Laravel\ChunkUpload\Handler\HandlerFactory;

class DocumentVersionController extends Controller
{
    private $documentVersionRepository;
    protected $client;
    protected $service;

    public function __construct(DocumentVersionsRepositoryInterface $documentVersionRepository)
    {
        $this->documentVersionRepository = $documentVersionRepository;

        $this->client = new \Google_Client();
        $this->client->setClientId(env('GOOGLE_DRIVE_CLIENT_ID'));
        $this->client->setClientSecret(env('GOOGLE_DRIVE_CLIENT_SECRET'));
        $this->client->refreshToken(env('GOOGLE_DRIVE_REFRESH_TOKEN'));
        $this->client->setAccessType('offline');
        $this->client->setApprovalPrompt("force");

        $this->service = new \Google\Service\Drive($this->client);
    }

    public function index($id)
    {
        return response()->json($this->documentVersionRepository->getDocumentversion($id));
    }

    public function saveNewVersionDocument(Request $request)
    {
        $receiver = new FileReceiver('file', $request, HandlerFactory::classFromRequest($request));

        $fileReceived = $receiver->receive(); // receive file

        if ($fileReceived->isFinished()) {
            $file = $fileReceived->getFile(); // get file

            $drivePath = Uuid::uuid4().$request->resumableFilename;

            $fileMetadata = new DriveFile(array('name' => $drivePath));
            $content = file_get_contents($file);
            $driveFile = $this->service->files->create($fileMetadata, array(
                'data' => $content,
                'mimeType' => $file->getClientMimeType(),
                'uploadType' => 'multipart',
                'fields' => 'id'));

            $path = $driveFile->id;

            return response()->json($this->documentVersionRepository->saveNewDocumentVersion($request, $path), 201);
        }
        // $path = $request->file('uploadFile')->storeAs(
        //     'documents',
        //     Uuid::uuid4() . '.' . $request->file('uploadFile')->getClientOriginalExtension()
        // );
    }

    public function restoreDocumentVersion($id, $versionId)
    {
        return response()->json($this->documentVersionRepository->restoreDocumentVersion($id, $versionId), 201);
    }
}
