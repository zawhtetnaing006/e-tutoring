<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            SubjectSeeder::class,
            UserSubjectSeeder::class,
            TutorAssignmentSeeder::class,
            BlogSeeder::class,
            BlogCommentSeeder::class,
            ConversationSeeder::class,
            MessageSeeder::class,
            NotificationSeeder::class,
        ]);
    }
}
