<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed role-permission mappings.
     */
    public function run(): void
    {
        foreach (Role::all() as $role) {
            $allPermissions = Permission::where('guard_name', $role->guard_name)
                ->get();

            $viewPermissions = Permission::where('guard_name', $role->guard_name)
                ->where('name', 'like', '%.view')
                ->get();

            $role->syncPermissions(
                $role->name === 'admin' ? $allPermissions : $viewPermissions
            );
        }
    }
}
