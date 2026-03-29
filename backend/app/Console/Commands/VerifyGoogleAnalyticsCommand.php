<?php

namespace App\Console\Commands;

use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\MinuteRange;
use Illuminate\Console\Command;
use Spatie\Analytics\Analytics;
use Spatie\Analytics\AnalyticsClient;
use Spatie\Analytics\OrderBy;
use Spatie\Analytics\Period;

class VerifyGoogleAnalyticsCommand extends Command
{
    protected $signature = 'analytics:verify';

    protected $description = 'Test GA4 Data API credentials and show sample RunReport + Realtime rows.';

    public function handle(): int
    {
        $propertyId = config('analytics.property_id');
        $credentials = config('analytics.service_account_credentials_json');

        $this->line('Google Analytics 4 (Data API) check');
        $this->newLine();

        if (empty($propertyId)) {
            $this->error('ANALYTICS_PROPERTY_ID is not set or empty in .env');

            return self::FAILURE;
        }

        $this->info("Property ID: {$propertyId}");
        $cacheMinutes = (int) config('analytics.cache_lifetime_in_minutes', 0);
        $this->line("GA API cache TTL: {$cacheMinutes} minute(s) (set ANALYTICS_CACHE_LIFETIME_MINUTES; 0 = no cache).");

        if (is_array($credentials)) {
            $this->warn('Using credentials from config array (not a file path).');
        } elseif (! is_string($credentials) || ! is_file($credentials)) {
            $this->error('Service account JSON not found at: '.(is_string($credentials) ? $credentials : '(invalid path)'));
            $this->line('Add the key from Google Cloud (IAM → Service account → Keys → JSON), then either:');
            $this->line('- Save it as storage/app/analytics/service-account-credentials.json, or');
            $this->line('- Set ANALYTICS_SERVICE_ACCOUNT_CREDENTIALS_JSON in .env to the full path to that file.');

            return self::FAILURE;
        } else {
            $this->info('Credentials file: '.$credentials);
        }

        $this->newLine();

        try {
            /** @var Analytics $analytics */
            $analytics = app('laravel-analytics');
            $reportingDays = max(1, min(366, (int) config('analytics.reporting_days', 90)));
            $period = Period::days($reportingDays);

            $pages = $analytics->fetchMostVisitedPages($period, 5);
            $pagesByPath = $analytics->get(
                period: $period,
                metrics: ['screenPageViews'],
                dimensions: ['pagePath'],
                maxResults: 15,
                orderBy: [
                    OrderBy::metric('screenPageViews', true),
                ],
            );
            $browsers = $analytics->fetchTopBrowsers($period, 5);

            $this->info('Pages (legacy: pageTitle + fullPageUrl, top 5): '.$pages->count().' row(s)');
            foreach ($pages as $i => $row) {
                $this->line('  '.($i + 1).'. '.json_encode($row, JSON_UNESCAPED_SLASHES));
            }

            $this->newLine();
            $this->info('Pages by pagePath (matches staff dashboard, top 15): '.$pagesByPath->count().' row(s)');
            foreach ($pagesByPath as $i => $row) {
                $this->line('  '.($i + 1).'. '.json_encode($row, JSON_UNESCAPED_SLASHES));
            }

            $this->newLine();
            $this->info('Browsers (top 5): '.$browsers->count().' row(s)');
            foreach ($browsers as $i => $row) {
                $this->line('  '.($i + 1).'. '.json_encode($row, JSON_UNESCAPED_SLASHES));
            }

            $this->newLine();
            $this->line('Realtime API sample (last ~30 min) — dimension unifiedScreenName + metric screenPageViews.');
            $this->line('Note: Realtime does NOT support pagePath or browser; the staff dashboard uses RunReport only for routes/browsers.');
            $rtCount = 0;
            try {
                /** @var AnalyticsClient $gaClient */
                $gaClient = app(AnalyticsClient::class);
                $realtime = $gaClient->runRealtimeReport([
                    'property' => 'properties/'.$propertyId,
                    'minute_ranges' => [
                        (new MinuteRange)->setStartMinutesAgo(29)->setEndMinutesAgo(0),
                    ],
                    'metrics' => [new Metric(['name' => 'screenPageViews'])],
                    'dimensions' => [new Dimension(['name' => 'unifiedScreenName'])],
                    'limit' => 15,
                ]);
                foreach ($realtime->getRows() as $row) {
                    $dim = '';
                    $met = '0';
                    foreach ($row->getDimensionValues() as $dv) {
                        $dim = $dv->getValue();
                        break;
                    }
                    foreach ($row->getMetricValues() as $mv) {
                        $met = $mv->getValue();
                        break;
                    }
                    $this->line('  '.(++$rtCount).'. '.json_encode(['unifiedScreenName' => $dim, 'screenPageViews' => (int) $met], JSON_UNESCAPED_SLASHES));
                }
                if ($rtCount === 0) {
                    $this->warn('  No realtime rows (nobody active in the last ~30 minutes in this property).');
                }
            } catch (\Throwable $e) {
                $this->warn('  Realtime sample failed: '.$e->getMessage());
            }

            if ($pages->isEmpty() && $pagesByPath->isEmpty() && $browsers->isEmpty()) {
                $this->newLine();
                $this->warn('Standard RunReport returned no rows. Check:');
                $this->warn('- GA4 Admin → Data streams: Web stream Measurement ID (G-…) must match frontend VITE_GA_MEASUREMENT_ID.');
                $this->warn('- That stream must belong to THIS property ('.$propertyId.').');
                $this->warn('- Browse the app with devtools: Network → google-analytics / googletagmanager (disable blockers).');
            }

            $this->newLine();
            $this->line('If numbers look stale: php artisan config:clear && php artisan cache:clear');
            $this->line('Standard GA4 reports can lag hours behind real browsing; use Admin → DebugView while testing (debug_mode in Vite dev).');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            $this->newLine();
            $this->line('Common fixes:');
            $this->line('- Enable "Google Analytics Data API" for the GCP project that owns the service account.');
            $this->line('- In GA4 Admin → Property access: add the service account email with Viewer.');
            $this->line('- Run: php artisan config:clear');
            $this->newLine();
            $this->line($e::class.' in '.$e->getFile().':'.$e->getLine());

            return self::FAILURE;
        }
    }
}
