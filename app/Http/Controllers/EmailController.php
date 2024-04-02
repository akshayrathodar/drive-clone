<?php

namespace App\Http\Controllers;

use App\Models\EmailSMTPSettings;
use App\Repositories\Contracts\SendEmailRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Repositories\Exceptions\RepositoryException;

class EmailController extends Controller
{
    private $sendEmailRepository;

    public function __construct(SendEmailRepositoryInterface $sendEmailRepository)
    {
        $this->sendEmailRepository = $sendEmailRepository;
    }

    public function sendEmail(Request $request)
    {
        $defaultSMTP = EmailSMTPSettings::where('isDefault', 1)->first();
        if ($defaultSMTP == null) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Default SMTP configuration does not exist.',
            ], 422);
        }

        $email = Auth::parseToken()->getPayload()->get('email');

        if ($email == null) {
            throw new RepositoryException('Email does not exist.');
        }

        $request['fromEmail'] = $defaultSMTP->userName;
        $request['isSend'] = false;
        return  response($this->sendEmailRepository->create($request->all()), 201);
    }
}
