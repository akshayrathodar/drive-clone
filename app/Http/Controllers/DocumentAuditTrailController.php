<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Documents;
use App\Repositories\Contracts\DocumentAuditTrailRepositoryInterface;
use Illuminate\Support\Facades\Storage;

class DocumentAuditTrailController extends Controller
{
    private $documentAuditTrailRepository;
    protected $queryString;

    public function __construct(DocumentAuditTrailRepositoryInterface $documentAuditTrailRepository)
    {
        $this->documentAuditTrailRepository = $documentAuditTrailRepository;
    }

    public function getDocumentAuditTrails(Request $request)
    {
        $queryString = (object) $request->all();

        $count = $this->documentAuditTrailRepository->getDocumentAuditTrailsCount($queryString);
        return response()->json($this->documentAuditTrailRepository->getDocumentAuditTrails($queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $queryString->pageSize, 'skip' => $queryString->skip]);
    }

    public function downloadDocument($id)
    {
        $file = Documents::findOrFail($id);
        $fileupload = $file->url;

        if (Storage::disk('local')->exists($fileupload)) {
            $file_contents = Storage::disk('local')->get($fileupload);
            $fileType = Storage::mimeType($fileupload);

            $fileExtension = explode('.', $file->url);
            return response($file_contents)
                ->header('Cache-Control', 'no-cache private')
                ->header('Content-Description', 'File Transfer')
                ->header('Content-Type', $fileType)
                ->header('Content-length', strlen($file_contents))
                ->header('Content-Disposition', 'attachment; filename=' . $file->name . '.' . $fileExtension[1])
                ->header('Content-Transfer-Encoding', 'binary');
        }
    }

    public function fileUpload()
    {
        return view('fileUpload');
    }

    public function saveDocumentAuditTrail(Request $request)
    {
        return response()->json($this->documentAuditTrailRepository->saveDocumentAuditTrail($request));
    }

    public function deleteDocument($id)
    {
        return response($this->documentAuditTrailRepository->delete($id), 204);
    }
}
