<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class BlogCommentSeeder extends Seeder
{
    /**
     * Seed blog comments for detail and count testing.
     */
    public function run(): void
    {
        $comments = [
            [
                'blog_title' => 'Welcome to the Greenwich tutoring hub',
                'commenter_role_code' => Role::TUTOR,
                'comment_text' => 'This gives tutors a clear place to share updates with students.',
            ],
            [
                'blog_title' => 'Welcome to the Greenwich tutoring hub',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'A central place for announcements will help a lot during busy weeks.',
            ],
            [
                'blog_title' => 'How I plan weekly tutoring sessions',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'The reflection step is useful because it shows what I still need to revise.',
            ],
            [
                'blog_title' => 'Study habits that helped me improve',
                'commenter_role_code' => Role::STAFF,
                'comment_text' => 'This is the kind of student perspective we should encourage more often.',
            ],
            [
                'blog_title' => 'Making one-to-one writing support more practical',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'Bringing one paragraph draft into the session made feedback much easier to act on.',
            ],
            [
                'blog_title' => 'Making one-to-one writing support more practical',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'The rubric idea is useful because it keeps the discussion tied to marking criteria.',
            ],
            [
                'blog_title' => 'Revision checkpoints for data-heavy modules',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'Short checkpoints work well for me because I can see what is still weak each week.',
            ],
            [
                'blog_title' => 'Revision checkpoints for data-heavy modules',
                'commenter_role_code' => Role::TUTOR,
                'comment_text' => 'I use a similar structure in programming modules and it improves attendance too.',
            ],
            [
                'blog_title' => 'Common security mistakes I see in student projects',
                'commenter_role_code' => Role::TUTOR,
                'comment_text' => 'Input validation is still one of the easiest quality wins for student teams.',
            ],
            [
                'blog_title' => 'Common security mistakes I see in student projects',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'A checklist for submission week would help because those issues are easy to miss under time pressure.',
            ],
            [
                'blog_title' => 'What helped me stay consistent before exams',
                'commenter_role_code' => Role::TUTOR,
                'comment_text' => 'That kind of small daily routine is usually easier to sustain than last-minute cramming.',
            ],
            [
                'blog_title' => 'Group revision is useful when everyone brings a question',
                'commenter_role_code' => Role::STUDENT,
                'comment_text' => 'We tried this last week and the session stayed much more focused.',
            ],
        ];

        $blogsByTitle = Blog::query()
            ->whereIn('title', array_column($comments, 'blog_title'))
            ->get()
            ->keyBy('title');

        $commentersByRole = User::query()
            ->whereHas('role', fn ($query) => $query->whereIn('code', [Role::STAFF, Role::TUTOR, Role::STUDENT]))
            ->with('role')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (User $user): string => strtoupper((string) $user->role?->code));

        $commenterPools = [
            Role::STAFF => array_values(($commentersByRole->get(Role::STAFF) ?? collect())->all()),
            Role::TUTOR => array_values(($commentersByRole->get(Role::TUTOR) ?? collect())->all()),
            Role::STUDENT => array_values(($commentersByRole->get(Role::STUDENT) ?? collect())->all()),
        ];

        $commenterIndexes = [
            Role::STAFF => 0,
            Role::TUTOR => 0,
            Role::STUDENT => 0,
        ];

        foreach ($comments as $commentData) {
            $blog = $blogsByTitle[$commentData['blog_title']] ?? null;
            $commenterRoleCode = $commentData['commenter_role_code'];
            $commenterPool = $commenterPools[$commenterRoleCode] ?? [];

            if (! $blog instanceof Blog || $commenterPool === []) {
                continue;
            }

            $commenter = $commenterPool[$commenterIndexes[$commenterRoleCode] % count($commenterPool)];
            $commenterIndexes[$commenterRoleCode]++;

            BlogComment::create([
                'blog_id' => $blog->id,
                'commenter_user_id' => $commenter->id,
                'comment_text' => $commentData['comment_text'],
            ]);
        }
    }
}
