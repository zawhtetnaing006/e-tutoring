import { apiClient } from '@/lib/api-client'

export type HealthResponse = {
  status: string
  app: string
  timestamp: string
}

/**
 * GET /api/health from Laravel backend.
 */
export function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('health')
}
