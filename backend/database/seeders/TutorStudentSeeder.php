<?php

namespace Database\Seeders;

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
            userType: User::TYPE_TUTOR,
            role: 'tutor',
            emailPrefix: 'seeded.tutor'
        );

        $this->seedUsers(
            count: 30,
            userType: User::TYPE_STUDENT,
            role: 'student',
            emailPrefix: 'seeded.student'
        );
    }

    private function seedUsers(
        int $count,
        string $userType,
        string $role,
        string $emailPrefix
    ): void {
        for ($index = 1; $index <= $count; $index++) {
            $user = User::factory()->make([
                'name' => sprintf('%s %02d', ucfirst(strtolower($userType)), $index),
                'email' => sprintf('%s%02d@example.com', $emailPrefix, $index),
                'user_type' => $userType,
                'is_active' => true,
            ]);

            $persistedUser = User::updateOrCreate(
                ['email' => $user->email],
                [
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'country' => $user->country,
                    'city' => $user->city,
                    'township' => $user->township,
                    'is_active' => true,
                    'user_type' => $userType,
                    'password' => 'password',
                ]
            );

            $persistedUser->syncRoles([$role]);
        }
    }
}
