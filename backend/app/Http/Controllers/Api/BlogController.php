<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Blog\StoreBlogRequest;
use App\Http\Requests\Blog\UpdateBlogRequest;
use App\Http\Requests\BlogComment\StoreBlogCommentRequest;
use App\Http\Resources\BlogCommentResource;
use App\Http\Resources\BlogResource;
use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogService;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

#[Group('Blogs', description: 'Blog management and user-generated comments.', weight: 11)]
class BlogController
{
    use FormatsListingResponse;

    public function __construct(
        private readonly AuditLogService $auditLogService
    )
    {
    }

    #[Endpoint(title: 'List Blogs')]
    #[QueryParameter('search', required: false, example: 'mathematics')]
    #[QueryParameter('is_active', required: false, example: true)]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function index(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_if($user === null, 401, 'Unauthenticated.');

        $data = $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));
        $search = trim((string) ($data['search'] ?? ''));
        $isActive = array_key_exists('is_active', $data) ? (bool) $data['is_active'] : null;

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

        if (! $this->canManageBlogs($user)) {
            $query->where('is_active', true);
        } elseif ($isActive !== null) {
            $query->where('is_active', $isActive);
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
    #[BodyParameter('hashtags', required: false, example: 'study,techniques')]
    #[Response(status: 201)]
    public function store(StoreBlogRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_if($user === null, 401, 'Unauthenticated.');

        $validated = $request->validated();
        $coverImagePath = $request->file('cover_image')?->store('blog-covers', 'public');

        $blog = Blog::query()->create([
            'author_user_id' => (int) $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'hashtags' => $this->normalizeHashtags($validated['hashtags'] ?? null),
            'cover_image_path' => $coverImagePath,
            'is_active' => true,
        ]);

        $blog->loadMissing('author');
        $blog->loadCount('comments');
        $targetLabel = $this->blogTargetLabel($blog);

        $this->auditLogService->log(
            request: $request,
            description: 'blog.created',
            subject: $blog,
            properties: [
                'meta' => [
                    'action_label' => 'CREATE_BLOG',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Created %s.', $targetLabel),
                ],
            ],
            event: 'created',
        );

        return response()->json(new BlogResource($blog), 201);
    }

    #[Endpoint(title: 'Get Blog')]
    #[Response(status: 200)]
    public function show(Request $request, Blog $blog): JsonResponse
    {
        $this->ensureCanReadBlog($request, $blog);

        $blog->increment('view_count');
        $blog->refresh();

        $blog->loadMissing([
            'author',
            'comments' => fn ($query) => $query->with('commenter')->oldest('id'),
        ]);
        $blog->loadCount('comments');

        return response()->json(new BlogResource($blog));
    }

    #[Endpoint(title: 'Update Blog')]
    #[BodyParameter('title', required: false, example: 'Updated blog title')]
    #[BodyParameter('content', required: false, example: 'Updated blog content...')]
    #[BodyParameter('hashtags', required: false, example: 'math,study')]
    #[BodyParameter('remove_cover_image', required: false, example: false)]
    #[Response(status: 200)]
    public function update(UpdateBlogRequest $request, Blog $blog): JsonResponse
    {
        $this->ensureCanManageBlog($request, $blog);
        $before = $this->blogAuditAttributes($blog);

        $validated = $request->validated();

        $payload = [];
        if (array_key_exists('title', $validated)) {
            $payload['title'] = $validated['title'];
        }
        if (array_key_exists('content', $validated)) {
            $payload['content'] = $validated['content'];
        }

        if (array_key_exists('hashtags', $validated)) {
            $payload['hashtags'] = $this->normalizeHashtags($validated['hashtags']);
        }

        if ($request->boolean('remove_cover_image', false) && $blog->cover_image_path) {
            Storage::disk('public')->delete($blog->cover_image_path);
            $payload['cover_image_path'] = null;
        }

        if ($request->hasFile('cover_image')) {
            if ($blog->cover_image_path) {
                Storage::disk('public')->delete($blog->cover_image_path);
            }

            $payload['cover_image_path'] = $request->file('cover_image')?->store('blog-covers', 'public');
        }

        $blog->update($payload);

        $freshBlog = $blog->fresh();
        $freshBlog->loadMissing('author');
        $freshBlog->loadCount('comments');
        $changes = $this->auditLogService->diff($before, $this->blogAuditAttributes($freshBlog));
        $hasContentLikeChanges = array_key_exists('content', $validated)
            || array_key_exists('hashtags', $validated)
            || $request->hasFile('cover_image')
            || $request->boolean('remove_cover_image', false);

        if ($changes['old'] !== [] || $changes['attributes'] !== [] || $hasContentLikeChanges) {
            $targetLabel = $this->blogTargetLabel($freshBlog);

            $this->auditLogService->log(
                request: $request,
                description: 'blog.updated',
                subject: $freshBlog,
                properties: [
                    'old' => $changes['old'],
                    'attributes' => $changes['attributes'],
                    'meta' => [
                        'action_label' => 'UPDATE_BLOG',
                        'target_label' => $targetLabel,
                        'description' => $this->blogUpdatedDescription(
                            targetLabel: $targetLabel,
                            changes: $changes,
                            validated: $validated,
                            coverImageChanged: $request->hasFile('cover_image')
                                || $request->boolean('remove_cover_image', false),
                        ),
                    ],
                ],
                event: 'updated',
            );
        }

        return response()->json(new BlogResource($freshBlog));
    }

    #[Endpoint(title: 'Toggle Blog Active Status')]
    #[Response(status: 200)]
    public function toggleStatus(Request $request, Blog $blog): JsonResponse
    {
        $this->ensureCanManageBlog($request, $blog);
        $before = $this->blogAuditAttributes($blog);

        $blog->update([
            'is_active' => !$blog->is_active,
        ]);

        $freshBlog = $blog->fresh();
        $freshBlog->loadMissing('author');
        $freshBlog->loadCount('comments');
        $targetLabel = $this->blogTargetLabel($freshBlog);

        $this->auditLogService->log(
            request: $request,
            description: 'blog.status_updated',
            subject: $freshBlog,
            properties: [
                'old' => [
                    'is_active' => $before['is_active'],
                ],
                'attributes' => [
                    'is_active' => $freshBlog->is_active,
                ],
                'meta' => [
                    'action_label' => 'UPDATE_BLOG_STATUS',
                    'target_label' => $targetLabel,
                    'description' => sprintf(
                        'Updated %s status to %s.',
                        $targetLabel,
                        $freshBlog->is_active ? 'active' : 'inactive',
                    ),
                ],
            ],
            event: 'updated',
        );

        return response()->json(new BlogResource($freshBlog));
    }

    #[Endpoint(title: 'Delete Blog')]
    #[Response(status: 204)]
    public function destroy(Request $request, Blog $blog): JsonResponse
    {
        $this->ensureCanManageBlog($request, $blog);
        $targetLabel = $this->blogTargetLabel($blog);

        if ($blog->cover_image_path) {
            Storage::disk('public')->delete($blog->cover_image_path);
        }

        $blog->delete();

        $this->auditLogService->log(
            request: $request,
            description: 'blog.deleted',
            subject: $blog,
            properties: [
                'meta' => [
                    'action_label' => 'DELETE_BLOG',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Deleted %s.', $targetLabel),
                ],
            ],
            event: 'deleted',
        );

        return response()->json(null, 204);
    }

    #[Endpoint(title: 'List Blog Comments')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function listComments(Request $request, Blog $blog): JsonResponse
    {
        $this->ensureCanReadBlog($request, $blog);

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

    private function ensureCanManageBlog(Request $request, Blog $blog): void
    {
        /** @var User|null $user */
        $user = $request->user();

        abort_if($user === null, 401, 'Unauthenticated.');

        if ($this->canManageBlogs($user)) {
            return;
        }

        abort(403, 'You are not allowed to modify this blog.');
    }

    private function ensureCanReadBlog(Request $request, Blog $blog): void
    {
        /** @var User|null $user */
        $user = $request->user();

        abort_if($user === null, 401, 'Unauthenticated.');

        if ($blog->is_active || $this->canManageBlogs($user)) {
            return;
        }

        abort(404, 'Blog not found.');
    }

    private function canManageBlogs(User $user): bool
    {
        return $user->hasAnyRole([Role::ADMIN, Role::STAFF]);
    }

    /**
     * @return list<string>
     */
    private function normalizeHashtags(?string $rawHashtags): array
    {
        $rawHashtags = trim((string) $rawHashtags);

        if ($rawHashtags === '') {
            return [];
        }

        return collect(explode(',', $rawHashtags))
            ->map(static fn (string $tag): string => trim($tag))
            ->filter(static fn (string $tag): bool => $tag !== '')
            ->map(static fn (string $tag): string => ltrim($tag, '#'))
            ->map(static fn (string $tag): string => mb_substr($tag, 0, 50))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function blogAuditAttributes(Blog $blog): array
    {
        $loadedBlog = $blog->loadMissing('author:id,name');

        return [
            'title' => $loadedBlog->title,
            'is_active' => $loadedBlog->is_active,
        ];
    }

    private function blogTargetLabel(Blog $blog): string
    {
        return sprintf('Blog#%d', (int) $blog->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     * @param  array<string, mixed>  $validated
     */
    private function blogUpdatedDescription(
        string $targetLabel,
        array $changes,
        array $validated,
        bool $coverImageChanged,
    ): string {
        $fields = array_values(array_unique([
            ...array_map(
                fn (string $field): string => $field === 'is_active'
                    ? 'status'
                    : strtolower(str_replace('_', ' ', $field)),
                array_values(array_unique([
                    ...array_keys($changes['old']),
                    ...array_keys($changes['attributes']),
                ])),
            ),
            ...(array_key_exists('content', $validated) ? ['content'] : []),
            ...(array_key_exists('hashtags', $validated) ? ['hashtags'] : []),
            ...($coverImageChanged ? ['cover image'] : []),
        ]));

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $fields));
    }
}
