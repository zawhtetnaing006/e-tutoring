<?php

namespace App\Providers;

use App\Models\Meeting;
use App\Policies\MeetingPolicy;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Spatie\Analytics\AnalyticsClient;
use Spatie\Analytics\AnalyticsClientFactory;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // After all providers boot (including spatie/laravel-analytics), replace AnalyticsClient
        // so GA API caching uses config('analytics.cache.store') instead of the default Redis store.
        $this->app->booted(function () {
            $this->app->bind(AnalyticsClient::class, function () {
                $analyticsConfig = config('analytics');
                $store = $analyticsConfig['cache']['store'] ?? 'file';

                $googleClient = AnalyticsClientFactory::createAuthenticatedGoogleClient($analyticsConfig);

                $client = new AnalyticsClient(
                    $googleClient,
                    Cache::store($store)
                );

                $client->setCacheLifeTimeInMinutes($analyticsConfig['cache_lifetime_in_minutes']);

                return $client;
            });
        });
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
