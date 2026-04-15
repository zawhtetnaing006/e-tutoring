<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    private const EMAIL_DOMAIN = 'greenwich.ac.uk';

    public const ADMIN_EMAIL = 'admin@greenwich.ac.uk';
    public const STAFF_EMAIL = 'staff@greenwich.ac.uk';
    public const TUTOR_EMAIL = 'tutor@greenwich.ac.uk';
    public const STUDENT_EMAIL = 'student@greenwich.ac.uk';

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
                'password' => 'Pass@w0rd!#',
            ]);
        }

        $seedableRoleIds = Role::query()
            ->whereIn('code', [Role::STAFF, Role::TUTOR, Role::STUDENT])
            ->pluck('id')
            ->all();

        User::factory()
            ->count(30)
            ->state(fn () => [
                'email' => fake()->unique()->userName() . '@' . self::EMAIL_DOMAIN,
                'role_id' => fake()->randomElement($seedableRoleIds),
                'phone' => fake()->phoneNumber(),
                'address' => fake()->streetAddress(),
                'country' => fake()->country(),
                'city' => fake()->city(),
                'township' => fake()->city(),
                'is_active' => true,
                'password' => 'Pass@w0rd!#',
            ])
            ->create();
    }
}
