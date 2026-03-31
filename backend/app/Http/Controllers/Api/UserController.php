<?php

namespace App\Http\Controllers\Api;

use App\Traits\FormatsListingResponse;
use App\Http\Requests\User\ExportUsersRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\UserGeneratedPasswordNotification;
use App\Notifications\UserWelcomeNotification;
use App\Services\AuditLogService;
use App\Services\UserExportService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

#[Group('Users', description: 'User management endpoints.', weight: 2)]
class UserController
{
    use FormatsListingResponse;

    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly UserExportService $userExportService,
    )
    {
    }

    #[Endpoint(title: 'List Users')]
    #[QueryParameter('name', required: false, example: 'Jane')]
    #[QueryParameter('role_code', required: false, example: 'STUDENT')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
                'name' => 'Staff User',
                'email' => 'staff@gmail.com',
                'phone' => null,
                'address' => null,
                'country' => null,
                'city' => null,
                'township' => null,
                'is_active' => true,
                'role_code' => 'STAFF',
                'role_name' => 'Staff',
                'subjects' => [[
                    'id' => 1,
                    'name' => 'Mathematics',
                    'description' => 'Core mathematics topics and problem-solving.',
                ]],
                'created_at' => '2026-02-05T00:00:00.000000Z',
                'updated_at' => '2026-02-05T00:00:00.000000Z',
            ]],
            'current_page' => 1,
            'total_page' => 1,
            'total_items' => 1,
        ]],
    )]
    public function index(Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $request->user();
        $filters = $request->validate([
            'name' => ['sometimes', 'string'],
            'role_code' => ['sometimes', 'string'],
        ]);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));
        $name = trim((string) ($filters['name'] ?? ''));
        $roleCode = strtoupper(trim((string) ($filters['role_code'] ?? '')));

        $users = User::query()
            ->with(['subjects:id,name,description', 'role:id,code,name'])
            ->when($currentUser?->hasRole(Role::TUTOR), function ($query) use ($currentUser) {
                $query->whereIn('id', function ($assignmentQuery) use ($currentUser): void {
                    $assignmentQuery->select('student_user_id')
                        ->from((new TutorAssignment())->getTable())
                        ->where('tutor_user_id', (int) $currentUser->id);
                });
            })
            ->when($name !== '', function ($query) use ($name) {
                $query->where('name', 'like', '%' . $name . '%');
            })
            ->when($roleCode !== '', function ($query) use ($roleCode) {
                $query->whereHas('role', function ($roleQuery) use ($roleCode): void {
                    $roleQuery->where('code', $roleCode);
                });
            })
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $users->getCollection()
            ->map(fn (User $user) => (new UserResource($user))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($users, $data);
    }

    #[Endpoint(title: 'Create User')]
    #[BodyParameter('name', required: true, example: 'Jane Doe')]
    #[BodyParameter('email', required: true, example: 'jane@example.com')]
    #[BodyParameter('auto_generate_password', required: false, example: true)]
    #[BodyParameter('password', required: false, example: 'secret123')]
    #[BodyParameter('phone', required: false, example: '+1-555-1234')]
    #[BodyParameter('address', required: false, example: '123 Main St')]
    #[BodyParameter('country', required: false, example: 'USA')]
    #[BodyParameter('city', required: false, example: 'New York')]
    #[BodyParameter('township', required: false, example: 'Manhattan')]
    #[BodyParameter('is_active', required: false, example: true)]
    #[BodyParameter('role_code', required: true, example: 'STUDENT')]
    #[BodyParameter('subject_ids', required: false, example: [1, 2])]
    #[Response(
        status: 201,
        examples: [[
            'uuid' => 'b0c1d2e3-4f5a-6789-aaaa-bbbbbbbbbbbb',
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '+1-555-1234',
            'address' => '123 Main St',
            'country' => 'USA',
            'city' => 'New York',
            'township' => 'Manhattan',
            'is_active' => true,
            'role_code' => 'STUDENT',
            'role_name' => 'Student',
            'subjects' => [[
                'id' => 1,
                'name' => 'Mathematics',
                'description' => 'Core mathematics topics and problem-solving.',
            ]],
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-05T00:00:00.000000Z',
        ]],
    )]
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $subjectIds = $validated['subject_ids'] ?? [];
        $roleCode = $validated['role_code'] ?? null;
        $autoGeneratePassword = (bool) ($validated['auto_generate_password'] ?? false);
        $plainPassword = $autoGeneratePassword
            ? Str::random(12)
            : (string) ($validated['password'] ?? '');

        unset($validated['subject_ids'], $validated['role_code'], $validated['auto_generate_password']);

        $validated['password'] = Hash::make($plainPassword);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $user = User::create($validated);
        $this->assignUserRole($user, $roleCode);
        $user->subjects()->sync($subjectIds);

        if ($autoGeneratePassword) {
            $user->notify(new UserGeneratedPasswordNotification($plainPassword));
        }

        $loadedUser = $this->loadUserRelations($user->fresh());
        $loadedUser->notify(new UserWelcomeNotification());
        $targetLabel = $this->userTargetLabel($loadedUser);

        $this->auditLogService->log(
            request: $request,
            description: 'user.created',
            subject: $loadedUser,
            properties: [
                'meta' => [
                    'action_label' => 'CREATE_USER',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Created %s.', $targetLabel),
                ],
            ],
            event: 'created',
        );

        return response()->json(new UserResource($loadedUser), 201);
    }

    #[Endpoint(title: 'Export Users')]
    #[BodyParameter('user_ids', required: true, example: [1, 2, 3])]
    #[BodyParameter('role_code', required: true, example: 'STAFF')]
    #[Response(status: 200, description: 'Excel file download')]
    public function export(ExportUsersRequest $request): StreamedResponse
    {
        $validated = $request->validated();
        $roleCode = strtoupper(trim((string) $validated['role_code']));
        $userIds = collect($validated['user_ids'])
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
        $userIdPositions = array_flip($userIds);

        $users = User::query()
            ->with('role:id,code,name')
            ->whereIn('id', $userIds)
            ->whereHas('role', function ($query) use ($roleCode): void {
                $query->where('code', $roleCode);
            })
            ->get()
            ->sortBy(static fn (User $user): int => $userIdPositions[$user->id] ?? PHP_INT_MAX)
            ->values();

        $spreadsheet = $this->userExportService->createSpreadsheet($users);
        $writer = $this->userExportService->createWriter($spreadsheet);
        $fileName = sprintf('%s-users.xlsx', Str::lower($roleCode));

        return response()->streamDownload(function () use ($writer, $spreadsheet): void {
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    #[Endpoint(title: 'Get User')]
    #[Response(
        status: 200,
        examples: [[
            'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
            'name' => 'Staff User',
            'email' => 'staff@gmail.com',
            'phone' => null,
            'address' => null,
            'country' => null,
            'city' => null,
            'township' => null,
            'is_active' => true,
            'role_code' => 'STAFF',
            'role_name' => 'Staff',
            'subjects' => [[
                'id' => 1,
                'name' => 'Mathematics',
                'description' => 'Core mathematics topics and problem-solving.',
            ]],
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-05T00:00:00.000000Z',
        ]],
    )]
    public function show(Request $request, User $user): JsonResponse
    {
        $this->ensureCanViewUser($request, $user);

        return response()->json(new UserResource($this->loadUserRelations($user)));
    }

    #[Endpoint(title: 'Update User')]
    #[BodyParameter('name', required: false, example: 'Jane Updated')]
    #[BodyParameter('email', required: false, example: 'jane.updated@example.com')]
    #[BodyParameter('password', required: false, example: 'new-secret-123')]
    #[BodyParameter('password_confirmation', required: false, example: 'new-secret-123')]
    #[BodyParameter('phone', required: false, example: '+1-555-0000')]
    #[BodyParameter('address', required: false, example: '456 Oak St')]
    #[BodyParameter('country', required: false, example: 'USA')]
    #[BodyParameter('city', required: false, example: 'San Francisco')]
    #[BodyParameter('township', required: false, example: 'SOMA')]
    #[BodyParameter('is_active', required: false, example: true)]
    #[BodyParameter('role_code', required: false, example: 'TUTOR')]
    #[BodyParameter('subject_ids', required: false, example: [1, 3])]
    #[Response(
        status: 200,
        examples: [[
            'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
            'name' => 'Jane Updated',
            'email' => 'jane.updated@example.com',
            'phone' => '+1-555-0000',
            'address' => '456 Oak St',
            'country' => 'USA',
            'city' => 'San Francisco',
            'township' => 'SOMA',
            'is_active' => true,
            'role_code' => 'TUTOR',
            'role_name' => 'Tutor',
            'subjects' => [[
                'id' => 1,
                'name' => 'Mathematics',
                'description' => 'Core mathematics topics and problem-solving.',
            ]],
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-06T00:00:00.000000Z',
        ]],
    )]
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->ensureCanUpdateUser($request, $user);

        $validated = $request->validated();
        $before = $this->userAuditAttributes($user);
        /** @var User|null $currentUser */
        $currentUser = $request->user();
        $canManagePrivilegedFields = $currentUser?->hasAnyRole([Role::ADMIN, Role::STAFF]) ?? false;
        $hasSubjectIds = array_key_exists('subject_ids', $validated);
        $subjectIds = $validated['subject_ids'] ?? [];
        $hasRoleCode = array_key_exists('role_code', $validated);
        $roleCode = $validated['role_code'] ?? null;
        $passwordChanged = array_key_exists('password', $validated);
        $profileImageChanged = false;

        if (! $canManagePrivilegedFields && ($hasRoleCode || array_key_exists('is_active', $validated))) {
            abort(403, 'You are not allowed to change account role or status.');
        }

        unset($validated['subject_ids'], $validated['role_code'], $validated['remove_profile_image'], $validated['profile_image']);

        if (array_key_exists('password', $validated)) {
            $validated['password'] = Hash::make((string) $validated['password']);
        }

        if ($request->boolean('remove_profile_image', false) && $user->profile_image_path) {
            Storage::disk('public')->delete($user->profile_image_path);
            $validated['profile_image_path'] = null;
            $profileImageChanged = true;
        }

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image_path) {
                Storage::disk('public')->delete($user->profile_image_path);
            }

            $validated['profile_image_path'] = $request->file('profile_image')?->store('profile-images', 'public');
            $profileImageChanged = true;
        }

        $user->update($validated);

        if ($hasRoleCode) {
            $this->assignUserRole($user, $roleCode);
        }

        if ($hasSubjectIds) {
            $user->subjects()->sync($subjectIds);
        }

        $loadedUser = $this->loadUserRelations($user->fresh());
        $changes = $this->auditLogService->diff($before, $this->userAuditAttributes($loadedUser));

        if ($changes['old'] !== [] || $changes['attributes'] !== [] || $passwordChanged || $profileImageChanged) {
            $targetLabel = $this->userTargetLabel($loadedUser);

            $this->auditLogService->log(
                request: $request,
                description: 'user.updated',
                subject: $loadedUser,
                properties: array_filter([
                    'old' => $changes['old'],
                    'attributes' => $changes['attributes'],
                    'meta' => [
                        'action_label' => 'UPDATE_USER',
                        'target_label' => $targetLabel,
                        'description' => $this->userUpdatedDescription($targetLabel, $changes, $passwordChanged),
                    ],
                ], static fn (mixed $value): bool => $value !== []),
                event: 'updated',
            );
        }

        return response()->json(new UserResource($loadedUser));
    }

    #[Endpoint(title: 'Delete User')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Request $request, User $user): JsonResponse
    {
        $targetLabel = $this->userTargetLabel($user);

        if ($user->profile_image_path) {
            Storage::disk('public')->delete($user->profile_image_path);
        }

        $user->delete();

        $this->auditLogService->log(
            request: $request,
            description: 'user.deleted',
            subject: $user,
            properties: [
                'meta' => [
                    'action_label' => 'DELETE_USER',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Deleted %s.', $targetLabel),
                ],
            ],
            event: 'deleted',
        );

        return response()->json(null, 204);
    }

    /**
     */
    private function assignUserRole(User $user, ?string $roleCode): void
    {
        $roleCode = $roleCode === null
            ? null
            : strtoupper(trim($roleCode));

        $roleId = $roleCode === null || $roleCode === ''
            ? null
            : Role::query()
                ->where('code', $roleCode)
                ->value('id');

        $user->update([
            'role_id' => $roleId,
        ]);
    }

    private function ensureCanViewUser(Request $request, User $user): void
    {
        /** @var User|null $currentUser */
        $currentUser = $request->user();

        if (! $currentUser) {
            abort(401, 'Unauthenticated.');
        }

        if ($currentUser->hasAnyRole([Role::ADMIN, Role::STAFF])) {
            return;
        }

        if (! $currentUser->hasRole(Role::TUTOR)) {
            abort(403, 'You are not allowed to view this user.');
        }

        if ((int) $currentUser->id === (int) $user->id) {
            return;
        }

        $isAssignedStudent = TutorAssignment::query()
            ->where('tutor_user_id', (int) $currentUser->id)
            ->where('student_user_id', (int) $user->id)
            ->exists();

        if ($isAssignedStudent) {
            return;
        }

        abort(403, 'You are not allowed to view this user.');
    }

    private function loadUserRelations(User $user): User
    {
        return $user->load(['subjects:id,name,description', 'role:id,code,name']);
    }

    private function userTargetLabel(User $user): string
    {
        return sprintf('User#%d', (int) $user->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     */
    private function userUpdatedDescription(string $targetLabel, array $changes, bool $passwordChanged): string
    {
        $fields = array_values(array_unique([
            ...array_map(
                fn (string $field): string => $this->userFieldLabel($field),
                array_values(array_unique([
                    ...array_keys($changes['old']),
                    ...array_keys($changes['attributes']),
                ])),
            ),
            ...($passwordChanged ? ['password'] : []),
        ]));

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $fields));
    }

    private function userFieldLabel(string $field): string
    {
        return match ($field) {
            'role_code' => 'role',
            'subject_ids' => 'subjects',
            'is_active' => 'status',
            'profile_image_path' => 'profile image',
            default => strtolower(str_replace('_', ' ', $field)),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function userAuditAttributes(User $user): array
    {
        $loadedUser = $this->loadUserRelations($user);

        return [
            'uuid' => $loadedUser->uuid,
            'name' => $loadedUser->name,
            'email' => $loadedUser->email,
            'phone' => $loadedUser->phone,
            'address' => $loadedUser->address,
            'country' => $loadedUser->country,
            'city' => $loadedUser->city,
            'township' => $loadedUser->township,
            'profile_image_path' => $loadedUser->profile_image_path,
            'is_active' => $loadedUser->is_active,
            'role_code' => $loadedUser->role?->code,
            'subject_ids' => $loadedUser->subjects
                ->pluck('id')
                ->sort()
                ->values()
                ->all(),
        ];
    }

    private function ensureCanUpdateUser(Request $request, User $user): void
    {
        /** @var User|null $currentUser */
        $currentUser = $request->user();

        abort_if($currentUser === null, 401, 'Unauthenticated.');

        if ($currentUser->hasAnyRole([Role::ADMIN, Role::STAFF]) || (int) $currentUser->id === (int) $user->id) {
            return;
        }

        abort(403, 'You are not allowed to update this user.');
    }
}
