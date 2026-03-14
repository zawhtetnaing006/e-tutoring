<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@greenwich.ac.uk';
    public const LINKED_STAFF_EMAIL = 'staff@gmail.com';
    public const LINKED_TUTOR_EMAIL = 'tutor@gmail.com';
    public const LINKED_STUDENT_EMAIL = 'student@gmail.com';

    /**
     * Seed default users for the demo environment.
     */
    public function run(): void
    {
        $users = [
            $this->makeUser('Admin User', self::ADMIN_EMAIL, 'Password', true, Role::ADMIN),
            $this->makeUser('Staff User', self::LINKED_STAFF_EMAIL, 'password', true, Role::STAFF),
            $this->makeUser('Tutor User', self::LINKED_TUTOR_EMAIL, 'password', true, Role::TUTOR),
            $this->makeUser('Student User', self::LINKED_STUDENT_EMAIL, 'password', true, Role::STUDENT),
            $this->makeUser('Marketing Manager', 'marketingmanager@greenwich.ac.uk', 'Password', true, Role::STAFF),
            $this->makeUser('FACH Coordinator', 'FACHCoordinator@greenwich.ac.uk', 'Password', true, Role::STAFF),
            $this->makeUser('DE309', 'De309@greenwich.ac.uk', 'Password', true, Role::STUDENT),
            $this->makeUser('Guest', 'guest@greenwich.ac.uk', 'Password', true, Role::STUDENT),
            $this->makeUser('Alicia Morgan', 'alicia.morgan@greenwich.ac.uk', 'Password', true, Role::TUTOR, '+44 7700 100101', '5 River Gardens Walk', 'London', 'Greenwich'),
            $this->makeUser('Daniel Hsu', 'daniel.hsu@greenwich.ac.uk', 'Password', true, Role::TUTOR, '+44 7700 100102', '27 Millennium Way', 'London', 'Greenwich Peninsula'),
            $this->makeUser('Mei Chen', 'mei.chen@greenwich.ac.uk', 'Password', true, Role::TUTOR, '+44 7700 100103', '11 Lanterns Way', 'London', 'Canary Wharf'),
            $this->makeUser('Oliver Grant', 'oliver.grant@greenwich.ac.uk', 'Password', true, Role::TUTOR, '+44 7700 100104', '83 Westferry Road', 'London', 'Isle of Dogs'),
            $this->makeUser('Priya Nair', 'priya.nair@greenwich.ac.uk', 'Password', true, Role::TUTOR, '+44 7700 100105', '6 Vanbrugh Hill', 'London', 'Blackheath'),
            $this->makeUser('Samuel Brooks', 'samuel.brooks@greenwich.ac.uk', 'Password', false, Role::TUTOR, '+44 7700 100106', '21 Creekside', 'London', 'Deptford'),
            $this->makeUser('Ava Collins', 'ava.collins@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100201', '14 Pelton Road', 'London', 'Greenwich'),
            $this->makeUser('Benjamin Scott', 'benjamin.scott@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100202', '88 Woolwich New Road', 'London', 'Woolwich'),
            $this->makeUser('Chloe Turner', 'chloe.turner@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100203', '7 Point Hill', 'London', 'Greenwich'),
            $this->makeUser('Ethan Parker', 'ethan.parker@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100204', '34 Tunnel Avenue', 'London', 'Greenwich Peninsula'),
            $this->makeUser('Fatima Ali', 'fatima.ali@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100205', '15 Tarves Way', 'London', 'Woolwich'),
            $this->makeUser('Hannah Reed', 'hannah.reed@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100206', '19 Greenwich High Road', 'London', 'Greenwich'),
            $this->makeUser('Isaac Foster', 'isaac.foster@greenwich.ac.uk', 'Password', false, Role::STUDENT, '+44 7700 100207', '41 Evelyn Street', 'London', 'Deptford'),
            $this->makeUser('Jasmine Lee', 'jasmine.lee@greenwich.ac.uk', 'Password', true, Role::STUDENT, '+44 7700 100208', '25 Bugsby Way', 'London', 'Charlton'),
        ];

        $roleIdsByCode = Role::pluck('id', 'code');

        foreach ($users as $userData) {
            $user = new User([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'phone' => $userData['phone'],
                'address' => $userData['address'],
                'country' => $userData['country'],
                'city' => $userData['city'],
                'township' => $userData['township'],
                'is_active' => $userData['is_active'],
                'role_id' => $roleIdsByCode[$userData['role_code']] ?? null,
                'password' => $userData['password'],
            ]);

            $user->uuid = (string) Str::uuid();
            $user->save();
        }
    }

    private function makeUser(
        string $name,
        string $email,
        string $password,
        bool $isActive,
        string $roleCode,
        ?string $phone = null,
        ?string $address = null,
        ?string $city = null,
        ?string $township = null,
        string $country = 'United Kingdom'
    ): array {
        return [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'is_active' => $isActive,
            'role_code' => $roleCode,
            'phone' => $phone,
            'address' => $address,
            'country' => $country,
            'city' => $city,
            'township' => $township,
        ];
    }
}
