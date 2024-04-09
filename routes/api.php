<?php


use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PagesController;
use App\Http\Controllers\ActionsController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentCommentController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserClaimController;
use App\Http\Controllers\EmailSMTPSettingController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentPermissionController;
use App\Http\Controllers\DocumentVersionController;
use App\Http\Controllers\DocumentAuditTrailController;
use App\Http\Controllers\DocumentTokenController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\RoleUsersController;
use App\Http\Controllers\LoginAuditController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\UserNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::controller(AuthController::class)->group(function () {
    Route::post('auth/login', 'login');
    Route::post('auth/logout', 'logout');
});

Route::get('document/{id}/officeviewer', [DocumentController::class, 'officeviewer']);
Route::get('/companyProfile', [CompanyProfileController::class, 'getCompanyProfile']);
Route::post('/companyProfile', [CompanyProfileController::class, 'updateCompanyProfile']);

Route::middleware(['auth'])->group(function () {

    Route::post('document/path', [DocumentController::class, 'folderPath']);
    Route::post('document/rename-folder/{id}', [DocumentController::class, 'renameFolder']);
    Route::post('document/folder/delete/{id}', [DocumentController::class, 'deleteFolder']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    Route::group(['middleware' => ['hasToken:USER_VIEW_USERS']], function () {
        Route::get('/user', [UserController::class, 'index']);
    });

    Route::get('/user-dropdown', [UserController::class, 'dropdown']);

    Route::middleware('hasToken:USER_CREATE_USER')->group(function () {
        Route::post('/user', [UserController::class, 'create']);
    });

    Route::middleware('hasToken:USER_EDIT_USER')->group(function () {
        Route::put('/user/{id}', [UserController::class, 'update']);
    });

    Route::middleware('hasToken:USER_DELETE_USER')->group(function () {
        Route::delete('/user/{id}', [UserController::class, 'destroy']);
    });

    Route::middleware('hasToken:USER_EDIT_USER')->group(function () {
        Route::get('/user/{id}', [UserController::class, 'edit']);
    });

    Route::middleware('hasToken:USER_RESET_PASSWORD')->group(function () {
        Route::post('/user/resetpassword', [UserController::class, 'submitResetPassword']);
    });


    Route::post('/user/changepassword', [UserController::class, 'changePassword']);

    Route::put('/users/profile', [UserController::class, 'updateUserProfile']);

    Route::middleware('hasToken:USER_ASSIGN_PERMISSION')->group(function () {
        Route::put('/userClaim/{id}', [UserClaimController::class, 'update']);
    });


    Route::middleware('hasToken:DASHBOARD_VIEW_DASHBOARD')->group(function () {
        Route::get('/dashboard/dailyreminder/{month}/{year}', [DashboardController::class, 'getDailyReminders']);
        Route::get('/dashboard/weeklyreminder/{month}/{year}', [DashboardController::class, 'getWeeklyReminders']);
        Route::get('/dashboard/monthlyreminder/{month}/{year}', [DashboardController::class, 'getMonthlyReminders']);
        Route::get('/dashboard/quarterlyreminder/{month}/{year}', [DashboardController::class, 'getQuarterlyReminders']);
        Route::get('/dashboard/halfyearlyreminder/{month}/{year}', [DashboardController::class, 'getHalfYearlyReminders']);
        Route::get('/dashboard/yearlyreminder/{month}/{year}', [DashboardController::class, 'getYearlyReminders']);
        Route::get('/dashboard/onetimereminder/{month}/{year}', [DashboardController::class, 'getOneTimeReminder']);
        Route::get('/Dashboard/GetDocumentByCategory', [DocumentController::class, 'getDocumentsByCategoryQuery']);
    });

    Route::get('/category/dropdown', [CategoryController::class, 'GetAllCategoriesForDropDown']);
    Route::middleware('hasToken:DOCUMENT_CATEGORY_MANAGE_DOCUMENT_CATEGORY')->group(function () {
        Route::get('category', [CategoryController::class, 'index']);
        Route::post('/category', [CategoryController::class, 'create']);
        Route::put('/category/{id}', [CategoryController::class, 'update']);
        Route::delete('/category/{id}', [CategoryController::class, 'destroy']);
        Route::get('/category/{id}/subcategories', [CategoryController::class, 'subcategories']);
    });

    Route::get('/pages', [PagesController::class, 'index']);
    Route::post('/pages', [PagesController::class, 'create']);
    Route::put('/pages/{id}', [PagesController::class, 'update']);
    Route::delete('/pages/{id}', [PagesController::class, 'destroy']);


    Route::get('/actions', [ActionsController::class, 'index']);
    Route::post('/actions', [ActionsController::class, 'create']);
    Route::put('/actions/{id}', [ActionsController::class, 'update']);
    Route::delete('/actions/{id}', [ActionsController::class, 'destroy']);

    Route::get('/role-dropdown', [RoleController::class, 'dropdown']);

    Route::group(['middleware' => ['hasToken:ROLE_VIEW_ROLES']], function () {
        Route::get('/role', [RoleController::class, 'index']);
    });

    Route::middleware('hasToken:ROLE_CREATE_ROLE')->group(function () {
        Route::post('/role', [RoleController::class, 'create']);
    });

    Route::middleware('hasToken:ROLE_EDIT_ROLE')->group(function () {
        Route::put('/role/{id}', [RoleController::class, 'update']);
    });

    Route::middleware('hasToken:ROLE_DELETE_ROLE')->group(function () {
        Route::delete('/role/{id}', [RoleController::class, 'destroy']);
    });

    Route::middleware('hasToken:ROLE_EDIT_ROLE')->group(function () {
        Route::get('/role/{id}', [RoleController::class, 'edit']);
    });

    Route::middleware('hasToken:EMAIL_MANAGE_SMTP_SETTINGS')->group(function () {
        Route::get('/emailSMTPSetting', [EmailSMTPSettingController::class, 'index']);
        Route::post('/emailSMTPSetting', [EmailSMTPSettingController::class, 'create']);
        Route::put('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'update']);
        Route::delete('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'destroy']);
        Route::get('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'edit']);
    });

    Route::get('/document/{id}/download/{isVersion}', [DocumentController::class, 'downloadDocument']);
    Route::get('/document/{id}/readText/{isVersion}', [DocumentController::class, 'readTextDocument']);
    Route::middleware('hasToken:ALL_DOCUMENTS_VIEW_DOCUMENTS')->group(function () {
        Route::get('/documents', [DocumentController::class, 'getDocuments']);
    });

    // Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_EDIT_DOCUMENT,ASSIGNED_DOCUMENTS_EDIT_DOCUMENT']], function () {
    //     Route::post('/document', [DocumentController::class, 'saveDocument']);
    // });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_CREATE_DOCUMENT,ASSIGNED_DOCUMENTS_CREATE_DOCUMENT']], function () {
        Route::post('/document', [DocumentController::class, 'saveDocument']);
    });

    Route::get('/document/assignedDocuments', [DocumentController::class, 'assignedDocuments']);

    Route::get('/document/{id}', [DocumentController::class, 'getDocumentbyId']);

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_EDIT_DOCUMENT,ASSIGNED_DOCUMENTS_EDIT_DOCUMENT']], function () {
        Route::get('/document/{id}/getMetatag', [DocumentController::class, 'getDocumentMetatags']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_EDIT_DOCUMENT,ASSIGNED_DOCUMENTS_EDIT_DOCUMENT']], function () {
        Route::put('/document/{id}', [DocumentController::class, 'updateDocument']);
    });


    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_DELETE_DOCUMENT,ASSIGNED_DOCUMENTS_DELETE_DOCUMENT']], function () {
        Route::delete('/document/{id}', [DocumentController::class, 'deleteDocument']);
    });

    Route::middleware('hasToken:DOCUMENT_AUDIT_TRAIL_VIEW_DOCUMENT_AUDIT_TRAIL')->group(function () {
        Route::get('/documentAuditTrail', [DocumentAuditTrailController::class, 'getDocumentAuditTrails']);
    });

    Route::post('/documentAuditTrail', [DocumentAuditTrailController::class, 'saveDocumentAuditTrail']);

    Route::get('/documentComment/{documentId}', [DocumentCommentController::class, 'index']);

    Route::delete('/documentComment/{id}', [DocumentCommentController::class, 'destroy']);

    Route::post('/documentComment', [DocumentCommentController::class, 'saveDocumentComment']);

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT,ASSIGNED_DOCUMENTS_SHARE_DOCUMENT']], function () {
        Route::get('/DocumentRolePermission/{id}', [DocumentPermissionController::class, 'edit']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT,ASSIGNED_DOCUMENTS_SHARE_DOCUMENT']], function () {
        Route::post('/documentRolePermission', [DocumentPermissionController::class, 'addDocumentRolePermission']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT,ASSIGNED_DOCUMENTS_SHARE_DOCUMENT']], function () {
        Route::post('/documentUserPermission', [DocumentPermissionController::class, 'addDocumentUserPermission']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT,ASSIGNED_DOCUMENTS_SHARE_DOCUMENT']], function () {
        Route::post('/documentRolePermission/multiple', [DocumentPermissionController::class, 'multipleDocumentsToUsersAndRoles']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT,ASSIGNED_DOCUMENTS_SHARE_DOCUMENT']], function () {
        Route::delete('/documentUserPermission/{id}', [DocumentPermissionController::class, 'deleteDocumentUserPermission']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT,ASSIGNED_DOCUMENTS_SHARE_DOCUMENT']], function () {
        Route::delete('/documentRolePermission/{id}', [DocumentPermissionController::class, 'deleteDocumentRolePermission']);
    });


    Route::get('/document/{id}/isDownloadFlag/isPermission/{isPermission}', [DocumentPermissionController::class, 'getIsDownloadFlag']);

    Route::get('/documentversion/{documentId}', [DocumentVersionController::class, 'index']);

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_VIEW_DOCUMENTS,ASSIGNED_DOCUMENTS_UPLOAD_NEW_VERSION']], function () {
        Route::post('/documentversion', [DocumentVersionController::class, 'saveNewVersionDocument']);
    });

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_VIEW_DOCUMENTS,ASSIGNED_DOCUMENTS_UPLOAD_NEW_VERSION']], function () {
        Route::post('/documentversion/{id}/restore/{versionId}', [DocumentVersionController::class, 'restoreDocumentVersion']);
    });

    Route::get('/documentToken/{documentId}/token', [DocumentTokenController::class, 'getDocumentToken']);
    Route::delete('/documentToken/{token}', [DocumentTokenController::class, 'deleteDocumentToken']);
    Route::post('/reminder/document', [ReminderController::class, 'addReminder']);
    Route::get('/reminder/{id}/myreminder', [ReminderController::class, 'edit']);

    Route::middleware('hasToken:USER_ASSIGN_USER_ROLE')->group(function () {
        Route::get('/roleusers/{roleId}', [RoleUsersController::class, 'getRoleUsers']);
    });

    Route::middleware('hasToken:USER_ASSIGN_USER_ROLE')->group(function () {
        Route::put('/roleusers/{roleId}', [RoleUsersController::class, 'updateRoleUsers']);
    });

    Route::middleware('hasToken:LOGIN_AUDIT_VIEW_LOGIN_AUDIT_LOGS')->group(function () {
        Route::get('/loginAudit', [LoginAuditController::class, 'getLoginAudit']);
    });

    Route::middleware('hasToken:REMINDER_VIEW_REMINDERS')->group(function () {
        Route::get('/reminder/all', [ReminderController::class, 'getReminders']);
    });

    Route::middleware('hasToken:REMINDER_CREATE_REMINDER')->group(function () {
        Route::post('/reminder', [ReminderController::class, 'addReminder']);
    });

    Route::middleware('hasToken:REMINDER_EDIT_REMINDER')->group(function () {
        Route::get('/reminder/{id}', [ReminderController::class, 'edit']);
    });

    Route::middleware('hasToken:REMINDER_EDIT_REMINDER')->group(function () {
        Route::put('/reminder/{id}', [ReminderController::class, 'updateReminder']);
    });

    Route::middleware('hasToken:REMINDER_DELETE_REMINDER')->group(function () {
        Route::delete('/reminder/{id}', [ReminderController::class, 'deleteReminder']);
    });

    Route::get('/reminder/all/currentuser', [ReminderController::class, 'getReminderForLoginUser']);

    Route::delete('/reminder/currentuser/{id}', [ReminderController::class, 'deleteReminderCurrentUser']);

    Route::middleware('hasToken:EMAIL_MANAGE_SMTP_SETTINGS')->group(function () {
        Route::put('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'update']);
        Route::delete('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'destroy']);
        Route::get('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'edit']);
    });

    Route::get('/userNotification/notification', [UserNotificationController::class, 'index']);
    Route::get('/userNotification/notifications', [UserNotificationController::class, 'getNotifications']);
    Route::post('/userNotification/MarkAsRead', [UserNotificationController::class, 'markAsRead']);
    Route::post('/UserNotification/MarkAllAsRead', [UserNotificationController::class, 'markAllAsRead']);

    Route::group(['middleware' => ['hasToken:ALL_DOCUMENTS_VIEW_DOCUMENTS,ASSIGNED_DOCUMENTS_SEND_EMAIL']], function () {
        Route::post('/email', [EmailController::class, 'sendEmail']);
    });

    //languages
    Route::post('/languages', [LanguageController::class, 'saveLanguage']);
    Route::delete('/languages/{id}', [LanguageController::class, 'deleteLanguage']);
    Route::get('/languages', [LanguageController::class, 'getLanguages']);
    Route::get('/defaultlanguage', [LanguageController::class, 'defaultlanguage']);
    Route::get('/languageById/{id}', [LanguageController::class, 'getFileContentById']);
});

Route::get('/i18n/{fileName}', [LanguageController::class, 'downloadFile']);


// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });
