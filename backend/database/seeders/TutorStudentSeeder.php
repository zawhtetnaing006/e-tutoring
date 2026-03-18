<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class TutorStudentSeeder extends Seeder
{
    /**
     * Seed tutor and student demo users.
     */
    public function run(): void
    {
        $this->seedUsers(
            count: 15,
            roleCode: Role::TUTOR,
            emailPrefix: 'seeded.tutor'
        );

        $this->seedUsers(
            count: 30,
            roleCode: Role::STUDENT,
            emailPrefix: 'seeded.student'
        );
    }

    private function seedUsers(
        int $count,
        string $roleCode,
        string $emailPrefix
    ): void {
        $roleId = Role::query()
            ->where('code', strtoupper($roleCode))
            ->value('id');

        for ($index = 1; $index <= $count; $index++) {
            $user = User::factory()->make([
                'name' => sprintf('%s %02d', ucfirst(strtolower($roleCode)), $index),
                'email' => sprintf('%s%02d@example.com', $emailPrefix, $index),
                'is_active' => true,
            ]);

            User::create([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'country' => $user->country,
                'city' => $user->city,
                'township' => $user->township,
                'role_id' => $roleId,
                'is_active' => true,
                'password' => 'password',
            ]);
        }
    }
}
