<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Seed application permissions.
     */
    public function run(): void
    {
        $guardName = config('auth.defaults.guard', 'web');

        $permissions = [
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
        ];

        foreach ($permissions as $permissionName) {
            Permission::findOrCreate($permissionName, $guardName);
        }
    }
}
