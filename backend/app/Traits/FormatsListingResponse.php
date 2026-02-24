<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait FormatsListingResponse
{
    protected function formatListingResponse(
        LengthAwarePaginator $paginator,
        array $data
    ): JsonResponse {
        return response()->json([
            'data' => $data,
            'current_page' => $paginator->currentPage(),
            'total_page' => $paginator->lastPage(),
            'total_items' => $paginator->total(),
        ]);
    }
}
