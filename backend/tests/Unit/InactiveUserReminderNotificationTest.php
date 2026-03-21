<?php

namespace Tests\Unit;

use App\Models\Role;
use App\Models\User;
use App\Notifications\InactiveUserReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InactiveUserReminderNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_mail_content_is_role_specific(): void
    {
        $role = Role::query()->create([
            'code' => Role::STUDENT,
            'name' => 'Student',
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your student account has been inactive on '.config('app.name'), $message->subject);
        $this->assertContains('Our records show that your student account has been inactive for 28 days.', $message->introLines);
        $this->assertContains('Please sign in again when you are ready to continue your learning activities.', $message->introLines);
    }

    public function test_tutor_mail_content_is_role_specific(): void
    {
        $role = Role::query()->create([
            'code' => Role::TUTOR,
            'name' => 'Tutor',
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your tutor account has been inactive on '.config('app.name'), $message->subject);
        $this->assertContains('Our records show that your tutor account has been inactive for 28 days.', $message->introLines);
        $this->assertContains('Please sign in again when you are ready to continue your tutoring activities.', $message->introLines);
    }

    public function test_staff_mail_content_is_role_specific(): void
    {
        $role = Role::query()->create([
            'code' => Role::STAFF,
            'name' => 'Staff',
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your staff account has been inactive on '.config('app.name'), $message->subject);
        $this->assertContains('Our records show that your staff account has been inactive for 28 days.', $message->introLines);
        $this->assertContains('Please sign in again when you are ready to continue managing platform operations.', $message->introLines);
    }

    public function test_admin_mail_content_is_role_specific(): void
    {
        $role = Role::query()->create([
            'code' => Role::ADMIN,
            'name' => 'Admin',
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your admin account has been inactive on '.config('app.name'), $message->subject);
        $this->assertContains('Our records show that your admin account has been inactive for 28 days.', $message->introLines);
        $this->assertContains('Please sign in again when you are ready to continue platform administration.', $message->introLines);
    }
}
