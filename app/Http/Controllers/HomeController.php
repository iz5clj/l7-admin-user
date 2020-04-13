<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $laravel  = app();
        $version  = $laravel::VERSION;
        $name     = config('app.name');
        $language = app()->getLocale();

        return view('dashboard', [
            "version"  => $version,
            "name"     => $name,
            "language" => $language
        ]);
    }
}
