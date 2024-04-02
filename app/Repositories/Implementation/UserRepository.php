<?php

namespace App\Repositories\Implementation;

use App\Models\UserRoles;
use App\Models\Users;
use Illuminate\Support\Facades\Auth;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Exceptions\RepositoryException;
use Illuminate\Support\Facades\DB;

//use Your Model

/**
 * Class UserRepository.
 */
class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    /**
     * @var Model
     */
    protected $model;

    /**
     * BaseRepository constructor..
     *
     *
     * @param Model $model
     */


    public static function model()
    {
        return Users::class;
    }

    public function createUser(array $attributes)
    {
        try {
            DB::beginTransaction();
            $model = $this->model->newInstance($attributes);
            $model->save();
            $this->resetModel();
            $result = $this->parseResult($model);
            foreach ($attributes['roleIds'] as $roleId) {
                $model = UserRoles::create(array(
                    'userId' =>   $result->id,
                    'roleId' =>  $roleId,
                ));
            }
            DB::commit();
            return $result;
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error in saving data.',
            ], 409);
        }
    }

    public function getUsersForDropdown()
    {
        $users = Users::select(['id', 'firstName', 'lastName', 'userName', 'email'])->get();
        return $users;
    }

    public function findUser($id)
    {
        $model = $this->model->with('userRoles')->with('userClaims')->findOrFail($id);
        $this->resetModel();
        return $this->parseResult($model);
    }

    public function updateUser($model, $id, $userRoles)
    {
        try {
            DB::beginTransaction();
            $userRoles1 =  UserRoles::where('userId', '=', $id)->get('id');
            UserRoles::destroy($userRoles1);
            $result = $this->parseResult($model);

            foreach ($userRoles as $roleId) {
                UserRoles::create(array(
                    'userId' =>   $result->id,
                    'roleId' =>  $roleId,
                ));
            }

            $model->save();

            $this->resetModel();

            $result = $this->parseResult($model);
            DB::commit();
            return $result;
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error in saving data.',
            ], 409);
        }
    }



    public function updateUserProfile($request)
    {
        try {
            $userId = Auth::parseToken()->getPayload()->get('userId');
            if ($userId == null) {
                throw new RepositoryException('User does not exist.');
            }

            $model = $this->model->findOrFail($userId);

            $model->firstName = $request->firstName;
            $model->lastName = $request->lastName;
            $model->phoneNumber = $request->phoneNumber;
            $model->save();
            return [];
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error in saving data.',
            ], 409);
        }
    }
}
