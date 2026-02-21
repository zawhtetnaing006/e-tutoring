<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Seed application roles.
     */
    public function run(): void
    {
        $guardName = config('auth.defaults.guard', 'web');

        $roles = [
            'admin',
            'tutor',
            'student',
        ];

        foreach ($roles as $roleName) {
            Role::findOrCreate($roleName, $guardName);
        }
    }
}
