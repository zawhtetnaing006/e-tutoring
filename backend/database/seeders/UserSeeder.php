<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@gmail.com';
    public const STAFF_EMAIL = 'staff@gmail.com';
    public const TUTOR_EMAIL = 'tutor@gmail.com';
    public const STUDENT_EMAIL = 'student@gmail.com';

    /**
     * Seed default users for the demo environment.
     */
    public function run(): void
    {
        $fixedUsers = [
            [
                'name' => 'Admin User',
                'email' => self::ADMIN_EMAIL,
                'role_code' => Role::ADMIN,
            ],
            [
                'name' => 'Staff User',
                'email' => self::STAFF_EMAIL,
                'role_code' => Role::STAFF,
            ],
            [
                'name' => 'Tutor User',
                'email' => self::TUTOR_EMAIL,
                'role_code' => Role::TUTOR,
            ],
            [
                'name' => 'Student User',
                'email' => self::STUDENT_EMAIL,
                'role_code' => Role::STUDENT,
            ],
        ];

        $roleIdsByCode = Role::pluck('id', 'code')->all();

        foreach ($fixedUsers as $userData) {
            User::factory()->create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'role_id' => $roleIdsByCode[$userData['role_code']] ?? null,
                'is_active' => true,
                'password' => 'password',
            ]);
        }

        $seedableRoleIds = Role::query()
            ->whereIn('code', [Role::STAFF, Role::TUTOR, Role::STUDENT])
            ->pluck('id')
            ->all();

        User::factory()
            ->count(30)
            ->state(fn () => [
                'role_id' => fake()->randomElement($seedableRoleIds),
                'phone' => fake()->phoneNumber(),
                'address' => fake()->streetAddress(),
                'country' => fake()->country(),
                'city' => fake()->city(),
                'township' => fake()->city(),
                'is_active' => true,
                'password' => 'password',
            ])
            ->create();
    }
}
