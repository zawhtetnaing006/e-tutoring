<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Seed a default API user.
     */
    public function run(): void
    {
        $name = 'Admin User';
        $email = 'admin@gmail.com';
        $password = 'password';

        $user = User::firstOrNew(['email' => $email]);

        if (empty($user->uuid)) {
            $user->uuid = (string) Str::uuid();
        }

        $user->name = $name;
        $user->password = Hash::make($password);
        $user->save();

        User::factory()->count(9)->create();
    }
}
