<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'code' => Role::ADMIN,
                'name' => 'Admin',
            ],
            [
                'code' => Role::STAFF,
                'name' => 'Staff',
            ],
            [
                'code' => Role::TUTOR,
                'name' => 'Tutor',
            ],
            [
                'code' => Role::STUDENT,
                'name' => 'Student',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::create($roleData);
        }
    }
}
