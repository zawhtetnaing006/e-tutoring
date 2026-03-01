/* eslint-disable security/detect-object-injection */
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { forgotPassword, verifyResetCode } from '@/features/auth/api'

export function PasswordResetCodePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = (location.state as { email?: string } | null)?.email

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true })
    }
  }, [email, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email) {
      toast.error(
        'Email is missing. Please start from the forgot password page.'
      )
      navigate('/forgot-password', { replace: true })
      return
    }

    const otp = otpDigits.join('')

    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }

    try {
      setIsSubmitting(true)
      await verifyResetCode(email, otp)

      toast.success('Code verified', {
        description: 'You can now set a new password.',
      })

      navigate('/password-reset/new', { state: { email, otp } })
    } catch (error) {
      const description =
        error instanceof ApiError
          ? error.message || 'The code is invalid or expired.'
          : 'The code is invalid or expired.'

      toast.error('Verification failed', { description })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangeDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)

    setOtpDigits(prev => {
      const next = [...prev]
      next[index] = digit
      return next
    })

    if (digit && index < 5) {
      const nextInput = inputRefs.current[index + 1]
      nextInput?.focus()
      nextInput?.select()
    }
  }

  const handlePaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>
  ) => {
    event.preventDefault()

    const text = event.clipboardData?.getData('text') ?? ''
    const digits = text.replace(/\D/g, '').slice(0, 6).split('')

    if (!digits.length) return

    setOtpDigits(prev => {
      const next = [...prev]
      let currentIndex = index

      for (const d of digits) {
        if (currentIndex > 5) break
        next[currentIndex] = d
        currentIndex += 1
      }

      return next
    })

    const nextIndex = Math.min(index + digits.length, 5)
    const nextInput = inputRefs.current[nextIndex]
    nextInput?.focus()
    nextInput?.select()
  }

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1]
      prevInput?.focus()
      prevInput?.select()
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error(
        'Email is missing. Please start from the forgot password page.'
      )
      navigate('/forgot-password', { replace: true })
      return
    }

    try {
      setIsResending(true)
      await forgotPassword(email)

      toast.success('Code resent', {
        description: 'If the email exists, a new reset code has been sent.',
      })
    } catch (error) {
      const description =
        error instanceof ApiError
          ? error.message || 'Unable to resend the code.'
          : 'Unable to resend the code.'

      toast.error('Resend failed', { description })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 h-16 w-16 rounded-lg bg-muted" />

        <h1 className="text-2xl font-semibold text-foreground">
          Password Reset
        </h1>
        <p className="mt-2 text-subtext text-muted-foreground">
          We sent a code to{' '}
          <span className="font-medium text-foreground">
            {email ?? 'your email address'}
          </span>
        </p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={element => {
                    inputRefs.current[index] = element
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpDigits[index]}
                  onChange={event =>
                    handleChangeDigit(index, event.target.value)
                  }
                  onPaste={event => handlePaste(index, event)}
                  onKeyDown={event => handleKeyDown(index, event)}
                  className="h-12 w-10 rounded-md border border-border bg-background text-center text-lg text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
              >
                {isResending ? 'Resending...' : 'Click to resend'}
              </button>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isSubmitting ? 'Verifying...' : 'Continue'}
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
