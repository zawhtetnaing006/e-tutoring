<?php

$propertyId = env('ANALYTICS_PROPERTY_ID');
if (is_string($propertyId)) {
    $propertyId = trim($propertyId);
    if (str_starts_with($propertyId, 'properties/')) {
        $propertyId = substr($propertyId, strlen('properties/'));
    }
    if ($propertyId === '') {
        $propertyId = null;
    }
} else {
    $propertyId = null;
}

return [

    /*
     * The property id of which you want to display data (numeric GA4 property ID only).
     */
    'property_id' => $propertyId,

    /*
     * Path to the service account JSON key, or set ANALYTICS_SERVICE_ACCOUNT_CREDENTIALS_JSON in .env
     * to an absolute path (e.g. where you downloaded the key from Google Cloud).
     */
    'service_account_credentials_json' => env('ANALYTICS_SERVICE_ACCOUNT_CREDENTIALS_JSON')
        ?: storage_path('app/analytics/service-account-credentials.json'),

    /*
     * Minutes to cache GA Data API responses (Spatie multiplies by 60 for Laravel cache seconds).
     * Default 5 so the staff dashboard is not stuck on hour-old data while developing.
     * Set to 0 to disable caching entirely (always hits Google; use when debugging).
     * Note: GA4 itself can take hours for new hits to appear in standard reports (not real-time).
     */
    'cache_lifetime_in_minutes' => (int) env('ANALYTICS_CACHE_LIFETIME_MINUTES', 5),

    /*
     * Cache store for GA Data API responses. Default `file` works without the PHP redis extension.
     * Set ANALYTICS_CACHE_STORE=redis in production if you use phpredis and want GA in Redis.
     */
    'cache' => [
        'store' => env('ANALYTICS_CACHE_STORE', 'file'),
    ],

    /*
     * Lookback window for standard (non-realtime) GA4 reports (most viewed pages, browsers).
     */
    'reporting_days' => max(1, min(366, (int) env('ANALYTICS_REPORTING_DAYS', 90))),
];
