<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Blog\StoreBlogRequest;
use App\Http\Requests\BlogComment\StoreBlogCommentRequest;
use App\Http\Resources\BlogCommentResource;
use App\Http\Resources\BlogResource;
use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\User;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Blogs', description: 'Public blogs with user-generated comments.', weight: 11)]
class BlogController
{
    use FormatsListingResponse;

    #[Endpoint(title: 'List Blogs')]
    #[QueryParameter('search', required: false, example: 'mathematics')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
        ]);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));
        $search = trim((string) ($data['search'] ?? ''));

        $query = Blog::query()
            ->with('author')
            ->withCount('comments');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', '%' . $search . '%')
                    ->orWhere('content', 'like', '%' . $search . '%');
            });
        }

        $blogs = $query
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $rows = $blogs->getCollection()
            ->map(fn (Blog $blog) => (new BlogResource($blog))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($blogs, $rows);
    }

    #[Endpoint(title: 'Create Blog')]
    #[BodyParameter('title', required: true, example: 'How to Learn Algebra Effectively')]
    #[BodyParameter('content', required: true, example: 'In this post, I share study techniques that improved my math grades...')]
    #[Response(status: 201)]
    public function store(StoreBlogRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_if($user === null, 401, 'Unauthenticated.');

        $blog = Blog::query()->create([
            'author_user_id' => (int) $user->id,
            'title' => $request->validated('title'),
            'content' => $request->validated('content'),
        ]);

        $blog->loadMissing('author');
        $blog->loadCount('comments');

        return response()->json(new BlogResource($blog), 201);
    }

    #[Endpoint(title: 'Get Blog')]
    #[Response(status: 200)]
    public function show(Blog $blog): JsonResponse
    {
        $blog->loadMissing([
            'author',
            'comments' => fn ($query) => $query->with('commenter')->oldest('id'),
        ]);
        $blog->loadCount('comments');

        return response()->json(new BlogResource($blog));
    }

    #[Endpoint(title: 'List Blog Comments')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function listComments(Request $request, Blog $blog): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));

        $comments = $blog->comments()
            ->with('commenter')
            ->oldest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $rows = $comments->getCollection()
            ->map(fn (BlogComment $comment) => (new BlogCommentResource($comment))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($comments, $rows);
    }

    #[Endpoint(title: 'Create Blog Comment')]
    #[BodyParameter('comment_text', required: true, example: 'This article was very helpful. Thank you!')]
    #[Response(status: 201)]
    public function storeComment(StoreBlogCommentRequest $request, Blog $blog): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_if($user === null, 401, 'Unauthenticated.');

        $comment = $blog->comments()->create([
            'commenter_user_id' => (int) $user->id,
            'comment_text' => $request->validated('comment_text'),
        ]);

        $comment->loadMissing('commenter');

        return response()->json(new BlogCommentResource($comment), 201);
    }
}
