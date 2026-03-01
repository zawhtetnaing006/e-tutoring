import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { forgotPassword } from '@/features/auth/api'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()

    if (!email) {
      toast.error('Email is required')
      return
    }

    try {
      setIsSubmitting(true)
      await forgotPassword(email)

      toast.success('Check your email', {
        description: 'If the email exists, a reset code has been sent.',
      })

      navigate('/password-reset/code', { state: { email } })
    } catch (error) {
      const description =
        error instanceof ApiError
          ? error.message || 'Unable to start password reset.'
          : 'Unable to start password reset.'

      toast.error('Request failed', { description })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 h-16 w-16 rounded-lg bg-muted" />

        <h1 className="text-2xl font-semibold text-foreground">
          Forgot password?
        </h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-subtext font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isSubmitting ? 'Sending...' : 'Continue'}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-4">
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
