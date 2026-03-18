<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class BlogSeeder extends Seeder
{
    /**
     * Seed blog posts for the active blog screens.
     */
    public function run(): void
    {
        $blogs = [
            [
                'author_role_code' => Role::STAFF,
                'title' => 'Welcome to the Greenwich tutoring hub',
                'content' => '<p>Use this space to share updates, study guidance, and practical reminders with tutors and students.</p>',
                'hashtags' => ['community', 'greenwich'],
                'is_active' => true,
                'view_count' => 18,
            ],
            [
                'author_role_code' => Role::TUTOR,
                'title' => 'How I plan weekly tutoring sessions',
                'content' => '<p>I break each session into revision, guided practice, and a short reflection so the student leaves with a clear next step.</p>',
                'hashtags' => ['tutoring', 'planning'],
                'is_active' => true,
                'view_count' => 12,
            ],
            [
                'author_role_code' => Role::STUDENT,
                'title' => 'Study habits that helped me improve',
                'content' => '<p>Keeping one concise notebook and reviewing after each session made it much easier to track what still needed work.</p>',
                'hashtags' => ['study', 'reflection'],
                'is_active' => false,
                'view_count' => 7,
            ],
            [
                'author_role_code' => Role::TUTOR,
                'title' => 'Making one-to-one writing support more practical',
                'content' => '<p>I now ask students to bring one paragraph draft, one marking rubric, and one question. That keeps each session focused and measurable.</p>',
                'hashtags' => ['writing', 'support'],
                'is_active' => true,
                'view_count' => 26,
            ],
            [
                'author_role_code' => Role::TUTOR,
                'title' => 'Revision checkpoints for data-heavy modules',
                'content' => '<p>Students usually improve faster when revision is broken into short weekly checkpoints instead of one large catch-up session.</p>',
                'hashtags' => ['revision', 'data'],
                'is_active' => true,
                'view_count' => 21,
            ],
            [
                'author_role_code' => Role::TUTOR,
                'title' => 'Common security mistakes I see in student projects',
                'content' => '<p>Hard-coded secrets, missing input validation, and weak password handling still appear regularly. They are good teaching moments because the fixes are concrete.</p>',
                'hashtags' => ['security', 'projects'],
                'is_active' => true,
                'view_count' => 31,
            ],
            [
                'author_role_code' => Role::STUDENT,
                'title' => 'What helped me stay consistent before exams',
                'content' => '<p>A short daily review block worked better for me than long weekend study sessions. It reduced panic and made tutorials easier to follow.</p>',
                'hashtags' => ['exams', 'routine'],
                'is_active' => true,
                'view_count' => 15,
            ],
            [
                'author_role_code' => Role::STUDENT,
                'title' => 'Group revision is useful when everyone brings a question',
                'content' => '<p>Our study group improved once everyone arrived with one question and one worked example. It stopped the sessions from drifting.</p>',
                'hashtags' => ['groupstudy', 'revision'],
                'is_active' => true,
                'view_count' => 11,
            ],
        ];

        $authorsByRole = User::query()
            ->whereHas('role', fn ($query) => $query->whereIn('code', [Role::STAFF, Role::TUTOR, Role::STUDENT]))
            ->with('role')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (User $user): string => strtoupper((string) $user->role?->code));

        $authorPools = [
            Role::STAFF => array_values(($authorsByRole->get(Role::STAFF) ?? collect())->all()),
            Role::TUTOR => array_values(($authorsByRole->get(Role::TUTOR) ?? collect())->all()),
            Role::STUDENT => array_values(($authorsByRole->get(Role::STUDENT) ?? collect())->all()),
        ];

        $authorIndexes = [
            Role::STAFF => 0,
            Role::TUTOR => 0,
            Role::STUDENT => 0,
        ];

        foreach ($blogs as $blogData) {
            $authorRoleCode = $blogData['author_role_code'];
            $authorPool = $authorPools[$authorRoleCode] ?? [];

            if ($authorPool === []) {
                continue;
            }

            $author = $authorPool[$authorIndexes[$authorRoleCode] % count($authorPool)];
            $authorIndexes[$authorRoleCode]++;
            unset($blogData['author_role_code']);

            Blog::create([
                ...$blogData,
                'author_user_id' => $author->id,
            ]);
        }
    }
}
