<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\User;
use Illuminate\Database\Seeder;

class BlogCommentSeeder extends Seeder
{
    /**
     * Seed blog comments for detail and count testing.
     */
    public function run(): void
    {
        $usersByEmail = User::whereIn('email', [
            UserSeeder::LINKED_STAFF_EMAIL,
            UserSeeder::LINKED_TUTOR_EMAIL,
            UserSeeder::LINKED_STUDENT_EMAIL,
            'alicia.morgan@greenwich.ac.uk',
            'daniel.hsu@greenwich.ac.uk',
            'priya.nair@greenwich.ac.uk',
            'ava.collins@greenwich.ac.uk',
            'chloe.turner@greenwich.ac.uk',
            'ethan.parker@greenwich.ac.uk',
            'fatima.ali@greenwich.ac.uk',
        ])->get()->keyBy('email');

        $comments = [
            [
                'blog_title' => 'Welcome to the Greenwich tutoring hub',
                'commenter_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'comment_text' => 'This gives tutors a clear place to share updates with students.',
            ],
            [
                'blog_title' => 'Welcome to the Greenwich tutoring hub',
                'commenter_email' => UserSeeder::LINKED_STUDENT_EMAIL,
                'comment_text' => 'A central place for announcements will help a lot during busy weeks.',
            ],
            [
                'blog_title' => 'How I plan weekly tutoring sessions',
                'commenter_email' => UserSeeder::LINKED_STUDENT_EMAIL,
                'comment_text' => 'The reflection step is useful because it shows what I still need to revise.',
            ],
            [
                'blog_title' => 'Study habits that helped me improve',
                'commenter_email' => UserSeeder::LINKED_STAFF_EMAIL,
                'comment_text' => 'This is the kind of student perspective we should encourage more often.',
            ],
            [
                'blog_title' => 'Making one-to-one writing support more practical',
                'commenter_email' => 'ava.collins@greenwich.ac.uk',
                'comment_text' => 'Bringing one paragraph draft into the session made feedback much easier to act on.',
            ],
            [
                'blog_title' => 'Making one-to-one writing support more practical',
                'commenter_email' => 'chloe.turner@greenwich.ac.uk',
                'comment_text' => 'The rubric idea is useful because it keeps the discussion tied to marking criteria.',
            ],
            [
                'blog_title' => 'Revision checkpoints for data-heavy modules',
                'commenter_email' => 'ethan.parker@greenwich.ac.uk',
                'comment_text' => 'Short checkpoints work well for me because I can see what is still weak each week.',
            ],
            [
                'blog_title' => 'Revision checkpoints for data-heavy modules',
                'commenter_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'comment_text' => 'I use a similar structure in programming modules and it improves attendance too.',
            ],
            [
                'blog_title' => 'Common security mistakes I see in student projects',
                'commenter_email' => 'daniel.hsu@greenwich.ac.uk',
                'comment_text' => 'Input validation is still one of the easiest quality wins for student teams.',
            ],
            [
                'blog_title' => 'Common security mistakes I see in student projects',
                'commenter_email' => 'fatima.ali@greenwich.ac.uk',
                'comment_text' => 'A checklist for submission week would help because those issues are easy to miss under time pressure.',
            ],
            [
                'blog_title' => 'What helped me stay consistent before exams',
                'commenter_email' => 'alicia.morgan@greenwich.ac.uk',
                'comment_text' => 'That kind of small daily routine is usually easier to sustain than last-minute cramming.',
            ],
            [
                'blog_title' => 'Group revision is useful when everyone brings a question',
                'commenter_email' => UserSeeder::LINKED_STUDENT_EMAIL,
                'comment_text' => 'We tried this last week and the session stayed much more focused.',
            ],
        ];

        foreach ($comments as $commentData) {
            $blog = Blog::where('title', $commentData['blog_title'])->first();
            $commenter = $usersByEmail[$commentData['commenter_email']] ?? null;

            if (! $blog instanceof Blog || ! $commenter instanceof User) {
                continue;
            }

            BlogComment::create([
                'blog_id' => $blog->id,
                'commenter_user_id' => $commenter->id,
                'comment_text' => $commentData['comment_text'],
            ]);
        }
    }
}
