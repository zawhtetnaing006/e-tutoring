import { apiClient, ApiError } from '@/lib/api-client'
import type { LoginResponse, User } from './types'
import { clearAuthSession, getAuthSession, saveAuthSession } from './storage'

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiClient<LoginResponse>('auth/login', {
    method: 'POST',
    body: { email, password },
  })

  saveAuthSession({
    token: response.token,
    tokenType: response.token_type,
    user: response.user,
  })

  return response
}

export async function forgotPassword(
  email: string
): Promise<{ message?: unknown }> {
  return apiClient<{ message?: unknown }>('auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function verifyResetCode(
  email: string,
  otp: string
): Promise<{ message?: unknown }> {
  return apiClient<{ message?: unknown }>('auth/verify-reset-code', {
    method: 'POST',
    body: { email, otp },
  })
}

export async function resetPassword(
  email: string,
  otp: string,
  password: string,
  passwordConfirmation: string
): Promise<{ message?: unknown }> {
  return apiClient<{ message?: unknown }>('auth/reset-password', {
    method: 'POST',
    body: {
      email,
      otp,
      password,
      password_confirmation: passwordConfirmation,
    },
  })
}

export async function getCurrentUser(): Promise<User> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  return apiClient<User>('auth/me', {
    method: 'GET',
    token: session.token,
  })
}

export async function logout(): Promise<void> {
  const session = getAuthSession()
  if (!session?.token) {
    clearAuthSession()
    return
  }

  try {
    await apiClient<{ message?: string }>('auth/logout', {
      method: 'POST',
      token: session.token,
    })
  } finally {
    clearAuthSession()
  }
}
