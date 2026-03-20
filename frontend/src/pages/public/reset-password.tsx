/* eslint-disable security/detect-possible-timing-attacks */
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { resetPassword } from '@/features/auth/api'

export function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const state = location.state as { email?: string; otp?: string } | null
  const email = state?.email
  const otp = state?.otp

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password', { replace: true })
    }
  }, [email, otp, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !otp) {
      toast.error(
        'Email or code is missing. Please restart the password reset flow.'
      )
      navigate('/forgot-password', { replace: true })
      return
    }

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setIsSubmitting(true)
      await resetPassword(email, otp, password, confirmPassword)

      toast.success('Password reset successful', {
        description: 'You can now log in with your new password.',
      })

      navigate('/login', { replace: true })
    } catch (error) {
      const description =
        error instanceof ApiError
          ? error.message || 'Unable to reset password.'
          : 'Unable to reset password.'

      toast.error('Reset failed', { description })
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
          Set new password
        </h1>

        <form
          className="mt-6 space-y-4 sm:space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
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
              autoComplete="new-password"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40 sm:py-2.5 sm:text-body"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground sm:text-subtext"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40 sm:py-2.5 sm:text-body"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 sm:mt-8">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span className="mr-1 text-base">&larr;</span>
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  )
}
