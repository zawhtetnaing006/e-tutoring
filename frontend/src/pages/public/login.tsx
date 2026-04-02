import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { login } from '@/features/auth/api'
import { useIsAuthenticated } from '@/features/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await login(email, password)

      toast.success('Logged in', {
        description: `Welcome back, ${result.user.name}`,
      })

      navigate('/', { replace: true })
    } catch (error) {
      const title =
        error instanceof ApiError && error.status === 403
          ? 'Account inactive'
          : 'Login failed'
      const description =
        error instanceof ApiError
          ? error.message || 'Unable to log in. Please check your credentials.'
          : 'Unable to log in. Please try again.'

      toast.error(title, { description })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md">
        <img
          src="/assets/logo.png"
          alt="eTutor System"
          className="mb-7 h-12 w-12 rounded-lg sm:h-16 sm:w-16"
        />

        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Log in to eTutor
        </h1>

        <form
          className="mt-6 space-y-4 sm:mt-6 sm:space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground sm:text-subtext"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40 sm:py-2.5 sm:text-body"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground sm:text-subtext"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40 sm:py-2.5 sm:text-body"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
          >
            {isSubmitting ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 sm:mt-8">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Forget your password?
          </Link>
        </div>
      </div>
    </div>
  )
}
