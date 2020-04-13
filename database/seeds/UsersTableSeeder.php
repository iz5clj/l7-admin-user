<?php

use App\User;
use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Is the database empty?
        // begin::create first user
        $michel                    = new User();
        $michel->name              = 'Michel';
        $michel->surname           = 'Sabatino';
        $michel->email             = 'ms@auxe.net';
        $michel->password          = Hash::make('12345678');
        $michel->email_verified_at = now();
        $michel->remember_token    = Str::random(10);
        $michel->save();

        $alicia                    = new User();
        $alicia->name              = 'Alicia';
        $alicia->surname           = 'Sabatino';
        $alicia->email             = 'alicia@auxe.net';
        $alicia->password          = Hash::make('12345678');
        $alicia->email_verified_at = now();
        $alicia->remember_token    = Str::random(10);
        $alicia->save();
    }
}
