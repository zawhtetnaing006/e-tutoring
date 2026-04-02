<?php

namespace Tests\Feature;

use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_listing_subjects_can_be_filtered_by_name(): void
    {
        Subject::query()->create([
            'name' => 'Mathematics',
            'description' => 'Core math topics',
            'is_active' => true,
        ]);

        Subject::query()->create([
            'name' => 'Science',
            'description' => 'Core science topics',
            'is_active' => true,
        ]);

        Subject::query()->create([
            'name' => 'Advanced Math',
            'description' => 'Higher-level math topics',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/subjects?name=math');

        $response
            ->assertOk()
            ->assertJsonPath('total_items', 2)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Advanced Math')
            ->assertJsonPath('data.1.name', 'Mathematics');
    }
}
