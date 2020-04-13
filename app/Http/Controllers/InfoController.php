<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use DB;
use PDO;

class InfoController extends Controller
{
    public function index() {

        $laravel     = app();
        // To use it directly in a Blade template, just use {{ App::VERSION() }}
        $php_version = PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;  

        try {
            $pdo              = DB::connection()->getPdo();
            $myDriver         = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
            $fullMysqlVersion = explode('-', $pdo->getAttribute(PDO::ATTR_SERVER_VERSION));
            $myVersion        = $fullMysqlVersion[0];
        } catch(\Exception $e) {
            $myDriver  = 'No SQL Connection';
            $myVersion = 'No Version';
        }

        $list = "";
        // $tables = DB::select("select * from sqlite_master WHERE type='table'");
        $tables = DB::table('sqlite_master')->get()->toArray();
        $total = DB::table('sqlite_master')->count();
        // $names = array_column( $tables, 'tbl_name');
        foreach($tables as $table) {
            $list .= $table->tbl_name . ', ' . PHP_EOL;
        }

        $infos = array(
            array(
                "title" => "Laravel Version",
                "value" => $laravel::VERSION
            ),
            array(
                "title" => "SAPI",
                "value" => PHP_SAPI
            ),
            array(
                "title" => "PHP Version",
                "value" => $php_version
            ),
            array(
                "title" => "Max File Size",
                "value" => ini_get('post_max_size')
            ),
            array(
                "title" => "Operating System",
                "value" => PHP_OS
            ),
            array(
                "title" => "Host Name",
                "value" => gethostname()
            ),
            array(
                "title" => "PHP Memory Limit",
                "value" => ini_get('memory_limit')
            ),
            array(
                "title" => $myDriver,
                "value" => $myVersion
            ),
            array(
                "title" => "All tables (" . $total . ")",
                "value" => $list
            )
        );

        return view('info.info', compact('infos'));
    }

}
