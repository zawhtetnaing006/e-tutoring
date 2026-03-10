<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_health_check_returns_ok_status(): void
    {
        $response = $this->get('/health-check');

        $response
            ->assertStatus(200)
            ->assertJson([
                'status' => 'OK',
            ]);
    }
}
