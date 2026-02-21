<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Seed default users.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@gmail.com',
                'password' => 'password',
                'role' => 'admin',
                'is_active' => true,
            ],
            [
                'name' => 'Tutor User',
                'email' => 'tutor@gmail.com',
                'password' => 'password',
                'role' => 'tutor',
                'is_active' => true,
            ],
            [
                'name' => 'Student User',
                'email' => 'student@gmail.com',
                'password' => 'password',
                'role' => 'student',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrNew(['email' => $userData['email']]);

            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }

            $user->name = $userData['name'];
            $user->is_active = $userData['is_active'];
            $user->password = Hash::make($userData['password']);
            $user->save();

            $user->syncRoles([$userData['role']]);
        }
    }
}
