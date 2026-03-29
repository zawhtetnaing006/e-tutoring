<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\Analytics\Analytics;
use Spatie\Analytics\OrderBy;
use Spatie\Analytics\Period;

/**
 * GA4 Data API: staff dashboard "most viewed pages" and "browsers" (Spatie laravel-analytics).
 */
class GoogleAnalyticsDashboardService
{
    /**
     * First URL path segment → dashboard label (matches `frontend/src/routes/AppRoutes.tsx`).
     *
     * @var array<string, string>
     */
    private const PAGE_LABELS_BY_FIRST_SEGMENT = [
        'staffs' => 'Staff',
        'tutors' => 'Tutor',
        'students' => 'Student',
        'subjects' => 'Subject',
        'allocations' => 'Allocation',
        'meeting-manager' => 'Meetings',
        'blogs' => 'Blogs',
        'communication-hub' => 'Com-Hub',
        'notifications' => 'Notification',
        'audit-log' => 'Audit Log',
        'profile' => 'Profile',
    ];

    /**
     * Standard report lookback (shared with `analytics:verify`).
     */
    public static function reportingPeriod(): Period
    {
        $days = max(1, min(366, (int) config('analytics.reporting_days', 90)));

        return Period::days($days);
    }

    /**
     * @return array{mostViewedPages: list<array{name: string, views: int}>, browsersUsed: list<array{name: string, value: int}>}
     */
    public function fetchDashboardData(): array
    {
        $propertyId = config('analytics.property_id');
        $credentials = config('analytics.service_account_credentials_json');

        if (empty($propertyId) || $credentials === null || $credentials === '') {
            return $this->emptyPayload();
        }

        if (! is_array($credentials) && (! is_string($credentials) || ! is_file($credentials))) {
            return $this->emptyPayload();
        }

        try {
            /** @var Analytics $analytics */
            $analytics = app('laravel-analytics');
            $period = self::reportingPeriod();

            $mostViewedPages = $analytics->get(
                period: $period,
                metrics: ['screenPageViews'],
                dimensions: ['pagePath'],
                maxResults: 100,
                orderBy: [
                    OrderBy::metric('screenPageViews', true),
                ],
            )
                ->map(function (array $row): ?array {
                    $pagePath = $row['pagePath'] ?? '';
                    $path = $this->pagePathFromGaDimension(is_string($pagePath) ? $pagePath : '');
                    if (! $this->isDashboardPagePath($path)) {
                        return null;
                    }
                    $label = $this->pageViewLabel('', $path);

                    return [
                        'name' => $label,
                        'views' => (int) ($row['screenPageViews'] ?? 0),
                    ];
                })
                ->filter()
                ->values()
                ->groupBy('name')
                ->map(function (Collection $rows): array {
                    $first = $rows->first();

                    return [
                        'name' => is_array($first) ? (string) ($first['name'] ?? '') : '',
                        'views' => (int) $rows->sum('views'),
                    ];
                })
                ->sortByDesc('views')
                ->take(8)
                ->values()
                ->all();

            $browsersUsed = $analytics->fetchTopBrowsers($period, 8)
                ->map(function (array $row): array {
                    $name = $row['browser'] ?? 'Unknown';
                    if (! is_string($name) || $name === '' || $name === '(not set)') {
                        $name = 'Unknown';
                    }

                    return [
                        'name' => $name,
                        'value' => (int) ($row['screenPageViews'] ?? 0),
                    ];
                })
                ->values()
                ->all();

            return [
                'mostViewedPages' => $mostViewedPages,
                'browsersUsed' => $browsersUsed,
            ];
        } catch (\Throwable $e) {
            report($e);

            return $this->emptyPayload();
        }
    }

    /**
     * @return array{mostViewedPages: list<array{name: string, views: int}>, browsersUsed: list<array{name: string, value: int}>}
     */
    private function emptyPayload(): array
    {
        return [
            'mostViewedPages' => [],
            'browsersUsed' => [],
        ];
    }

    /**
     * Only include authenticated app routes (matches `AppRoutes`); excludes /login, password reset, etc.
     */
    private function isDashboardPagePath(string $path): bool
    {
        $path = trim($path);
        if ($path === '' || $path === '/') {
            return true;
        }

        $segments = array_values(array_filter(explode('/', $path), fn (string $s): bool => $s !== ''));
        if ($segments === []) {
            return true;
        }

        return array_key_exists($segments[0], self::PAGE_LABELS_BY_FIRST_SEGMENT);
    }

    /**
     * Normalize GA4 `pagePath` (may include query/hash) to a pathname for route labels.
     */
    private function pagePathFromGaDimension(string $pagePath): string
    {
        $pagePath = trim($pagePath);
        if ($pagePath === '' || $pagePath === '(not set)') {
            return '';
        }

        if ($pagePath[0] !== '/') {
            $pagePath = '/'.$pagePath;
        }

        $pathOnly = parse_url($pagePath, PHP_URL_PATH);
        if (is_string($pathOnly) && $pathOnly !== '') {
            return $pathOnly;
        }

        return '/';
    }

    /**
     * Human-readable page name for charts: "/" → "Dashboard"; known routes use app labels; others fall back to title case.
     */
    private function pageDisplayNameFromPath(string $path): string
    {
        $path = trim($path);
        if ($path === '' || $path === '/') {
            return 'Dashboard';
        }

        $segments = array_values(array_filter(explode('/', $path), fn (string $s): bool => $s !== ''));
        if ($segments === []) {
            return 'Dashboard';
        }

        $first = $segments[0];
        if (isset(self::PAGE_LABELS_BY_FIRST_SEGMENT[$first])) {
            return self::PAGE_LABELS_BY_FIRST_SEGMENT[$first];
        }

        $parts = array_map(function (string $segment): string {
            $words = str_replace(['-', '_'], ' ', $segment);

            return Str::title($words);
        }, $segments);

        return implode(' · ', $parts);
    }

    /**
     * Prefer route-derived display name; fall back to GA page title when path is missing.
     */
    private function pageViewLabel(string $pageTitle, string $path): string
    {
        if ($path !== '') {
            return $this->pageDisplayNameFromPath($path);
        }

        if ($pageTitle !== '' && $pageTitle !== '(not set)') {
            return $pageTitle;
        }

        return 'Dashboard';
    }
}
