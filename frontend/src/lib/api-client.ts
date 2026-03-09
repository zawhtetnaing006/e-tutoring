/**
 * API client for Laravel backend.
 * Uses VITE_API_BASE_URL and sends credentials
 * for Sanctum cookie/session auth. For token auth, set Authorization via options.
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL
  return typeof url === 'string' && url.length > 0 ? url.replace(/\/$/, '') : ''
}

export type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown> | FormData | string | null
  token?: string | null
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback

  const payload = data as {
    message?: unknown
    error?: {
      details?: {
        errors?: Record<string, unknown>
      }
    }
  }

  const detailedErrors = payload.error?.details?.errors
  if (detailedErrors && typeof detailedErrors === 'object') {
    for (const value of Object.values(detailedErrors)) {
      if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
        return value[0]
      }
    }
  }

  if (typeof payload.message === 'string' && payload.message) {
    return payload.message
  }

  return fallback
}

/**
 * Fetch that prefixes path with VITE_API_BASE_URL, sends JSON by default,
 * credentials: 'include' for Laravel Sanctum cookies, and optional Bearer token.
 */
export async function apiClient<T>(
  path: string,
  init: ApiRequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Add it to .env or .env.local'
    )
  }
  const { body, token, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let finalBody: BodyInit | undefined
  if (body != null && !(body instanceof FormData)) {
    if (typeof body === 'string') {
      finalBody = body
      if (!headers.has('Content-Type'))
        headers.set('Content-Type', 'application/json')
    } else {
      finalBody = JSON.stringify(body)
      if (!headers.has('Content-Type'))
        headers.set('Content-Type', 'application/json')
    }
  } else if (body instanceof FormData) {
    finalBody = body
  }
  const url = path.startsWith('http')
    ? path
    : `${baseUrl}/${path.replace(/^\//, '')}`
  const res = await fetch(url, {
    ...rest,
    credentials: 'omit',
    headers,
    body: finalBody,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(
      res.status,
      getApiErrorMessage(data, res.statusText),
      data
    )
  }
  return data as T
}

export class ApiError extends Error {
  status: number
  payload?: unknown
  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export { getBaseUrl }
