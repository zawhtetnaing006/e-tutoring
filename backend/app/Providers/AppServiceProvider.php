<?php

namespace App\Providers;

use App\Models\Meeting;
use App\Policies\MeetingPolicy;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Meeting::class, MeetingPolicy::class);

        Gate::define('viewApiDocs', function ($user = null): bool {
            return (bool) config('scramble.public_docs', false);
        });

        Scramble::configure()->afterOpenApiGenerated(function (OpenApi $openApi): void {
            $openApi->secure(
                SecurityScheme::http('bearer')
                    ->as('bearerAuth')
                    ->setDescription('Use: Bearer {token}')
            );
        });
    }
}
