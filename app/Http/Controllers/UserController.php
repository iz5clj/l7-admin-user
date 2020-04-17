<?php

namespace App\Http\Controllers;

use App\User;
use Illuminate\Http\Request;
use Intervention\Image\Facades\Image;
use App\Http\Requests\UpdateUserRequest;
use Storage;

class UserController extends Controller
{
    /**
     * Show the form for editing an existing user
     *
     * @return \Illuminate\Http\Response
     */
    public function modify(User $user)
    {
        return view('user.createModifyForm')->with([
            'user'   => $user,
            'action' => 'modify'
        ]);

        //  $roles    = Role::all()->pluck('name', 'name')->toArray();
        //  $userRole = $user->getRoleNames()[0]; //get the first element of the array since we assign just 1 role to each user.

        //  return view('user.createModify')->with([
        //      'user'     => $user,
        //      'roles'    => $roles,
        //      'userRole' => $userRole,
        //      'action'   => 'modify'
        //  ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        //  if there is no file (avatar) use the default file; the one used in the migration during create database process.
        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $filename = time() . '.' . $avatar->getClientOriginalExtension();
            $image = Image::make($avatar)->fit(200);
            Storage::disk('avatar')->put($filename, $image->stream());
            $user->avatar  = $filename;
        } 

        if($request->has('noAvatar')) {
            $user->avatar = 'default.png';
        }
        
        $user->name    = $request->input('name');
        $user->surname = $request->input('surname');
        $user->email   = $request->input('email');

        $user->save();

        return redirect()
            ->route('dashboard')
            ->with('success', __('m.data updated'));
    }
}
