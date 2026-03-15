<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class NotificationSeeder extends Seeder
{
    /**
     * Seed demo notifications for existing users.
     */
    public function run(): void
    {
        $emails = [
            UserSeeder::LINKED_STAFF_EMAIL,
            UserSeeder::LINKED_TUTOR_EMAIL,
            UserSeeder::LINKED_STUDENT_EMAIL,
            'alicia.morgan@greenwich.ac.uk',
            'ava.collins@greenwich.ac.uk',
        ];

        $usersByEmail = User::whereIn('email', $emails)->get()->keyBy('email');

        $notifications = [
            ['email' => UserSeeder::LINKED_STAFF_EMAIL, 'name' => 'Mg Mg'],
            ['email' => UserSeeder::LINKED_TUTOR_EMAIL, 'name' => 'Alicia Morgan'],
            ['email' => UserSeeder::LINKED_STUDENT_EMAIL, 'name' => 'Daniel Hsu'],
            ['email' => 'alicia.morgan@greenwich.ac.uk', 'name' => 'Ava Collins'],
            ['email' => 'ava.collins@greenwich.ac.uk', 'name' => 'Mei Chen'],
            ['email' => UserSeeder::LINKED_STAFF_EMAIL, 'name' => 'Oliver Grant'],
            ['email' => UserSeeder::LINKED_TUTOR_EMAIL, 'name' => 'Fatima Ali'],
            ['email' => UserSeeder::LINKED_STUDENT_EMAIL, 'name' => 'Priya Nair'],
            ['email' => 'alicia.morgan@greenwich.ac.uk', 'name' => 'Samuel Brooks'],
            ['email' => 'ava.collins@greenwich.ac.uk', 'name' => 'Hannah Reed'],
            ['email' => UserSeeder::LINKED_STAFF_EMAIL, 'name' => 'Jasmine Lee'],
            ['email' => UserSeeder::LINKED_TUTOR_EMAIL, 'name' => 'Benjamin Scott'],
            ['email' => UserSeeder::LINKED_STUDENT_EMAIL, 'name' => 'Chloe Turner'],
            ['email' => 'alicia.morgan@greenwich.ac.uk', 'name' => 'Ethan Parker'],
            ['email' => 'ava.collins@greenwich.ac.uk', 'name' => 'Isaac Foster'],
            ['email' => UserSeeder::LINKED_STAFF_EMAIL, 'name' => 'Marketing Manager'],
            ['email' => UserSeeder::LINKED_TUTOR_EMAIL, 'name' => 'FACH Coordinator'],
            ['email' => UserSeeder::LINKED_STUDENT_EMAIL, 'name' => 'Guest'],
            ['email' => 'alicia.morgan@greenwich.ac.uk', 'name' => 'Staff User'],
            ['email' => 'ava.collins@greenwich.ac.uk', 'name' => 'Tutor User'],
        ];

        foreach ($notifications as $index => $notificationData) {
            $user = $usersByEmail[$notificationData['email']] ?? null;

            if (! $user instanceof User) {
                continue;
            }

            $createdAt = Carbon::now()->subMinutes(20 - $index);

            Notification::create([
                'user_id' => $user->id,
                'status' => Notification::STATUS_SENT,
                'is_read' => $index < 6,
                'payload' => [
                    'title' => 'New meeting scheduled',
                    'description' => 'You have meeting with '.$notificationData['name'],
                    'redirectLink' => 'https://www.google.com',
                ],
                'sent_at' => $createdAt->copy()->addMinute(),
                'created_at' => $createdAt,
            ]);
        }
    }
}
