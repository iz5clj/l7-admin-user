<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Auth::routes([
    'verify'   => true,
    'register' => true
]);

Route::group(
    [
        'prefix'     => 'admin',
        'middleware' => 'auth'
    ], function()
    {

        Route::get('/', 'AdminController@index')->name('dashboard');

        Route::get('user/create', 'UserController@create')->name('userCreateForm');
        Route::post('user/store', 'UserController@store')->name('userStore');
        Route::get('user/{user}', 'UserController@modify')->name('userModify');
        Route::put('user/{user}', 'UserController@update')->name('userUpdate');
        Route::delete('user/{user}', 'UserController@destroy')->name('userDestroy');

        Route::get('info', 'InfoController@index')->name('info');
    }
);

Route::get('/', function () {

    $laravel  = app();
    $version  = $laravel::VERSION;
    $name     = config('app.name');
    $language = app()->getLocale();
    
    return view('index', [
        "version"  => $version,
        "name"     => $name,
        "language" => $language
    ]);
})->name('index');

Route::get('test', function() {
    return view('test');
})->name('test');
