<?php

namespace Database\Seeders;

use App\Models\Role;
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
                'is_active' => true,
                'roles' => [Role::ADMIN],
            ],
            [
                'name' => 'Staff User',
                'email' => 'staff@gmail.com',
                'password' => 'password',
                'is_active' => true,
                'roles' => [Role::STAFF],
            ],
            [
                'name' => 'Tutor User',
                'email' => 'tutor@gmail.com',
                'password' => 'password',
                'is_active' => true,
                'roles' => [Role::TUTOR],
            ],
            [
                'name' => 'Student User',
                'email' => 'student@gmail.com',
                'password' => 'password',
                'is_active' => true,
                'roles' => [Role::STUDENT],
            ],
        ];

        $roleIdsByCode = Role::pluck('id', 'code');

        foreach ($users as $userData) {
            $user = User::firstOrNew(['email' => $userData['email']]);

            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }

            $user->name = $userData['name'];
            $user->is_active = $userData['is_active'];
            $user->password = Hash::make($userData['password']);
            $user->save();

            $roleIds = collect($userData['roles'])
                ->map(fn (string $roleCode): ?int => $roleIdsByCode[$roleCode] ?? null)
                ->filter()
                ->values()
                ->all();

            $user->roles()->sync($roleIds);
        }
    }
}
