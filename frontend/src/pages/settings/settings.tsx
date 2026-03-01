import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useZodForm } from '@/hooks/useZodForm'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { cn } from '@/lib/utils'

function isE164PhoneNumber(value: string) {
  return /^\+[1-9]\d{6,14}$/.test(value)
}

const profileSchema = z.object({
  userId: z.string(),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine(
      isE164PhoneNumber,
      'Please enter a valid phone number (e.g. +959XXXXXXXXX)'
    ),
  dateOfBirth: z.string().optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(values => values.newPassword === values.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

type ProfileFormValues = z.infer<typeof profileSchema>

function userToProfileValues(user: {
  uuid: string
  name: string
  email: string
  phone: string | null
}): ProfileFormValues {
  return {
    userId: user.uuid,
    username: user.name,
    email: user.email,
    phoneNumber: user.phone ?? '',
    dateOfBirth: '',
  }
}

const roleLabels: Record<string, string> = {
  staff: 'Staff',
  tutor: 'Tutor',
  student: 'Student',
}

type ActiveTab = 'profile' | 'audit'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const { data: user, isLoading } = useCurrentUser()

  const profileForm = useZodForm(profileSchema, {
    defaultValues: {
      userId: '',
      username: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
    },
  })

  useEffect(() => {
    if (user) {
      profileForm.reset(userToProfileValues(user))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when user loads; profileForm.reset is stable
  }, [user])

  const passwordForm = useZodForm(passwordSchema, {
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const handleProfileSubmit = profileForm.handleSubmit(values => {
    // TODO: connect to API when backend is ready
    toast.success('Profile saved', {
      description: 'Your profile details have been updated.',
    })
    void values
  })

  const handlePasswordSubmit = passwordForm.handleSubmit(values => {
    // TODO: connect to password update API
    toast.success('Password updated', {
      description: 'Your password has been changed successfully.',
    })
    void values
    setIsPasswordModalOpen(false)
    passwordForm.reset()
  })

  const handleCancelProfile = () => {
    if (user) profileForm.reset(userToProfileValues(user))
  }

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false)
    passwordForm.reset()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Setting</h1>
        <p className="text-subtext text-muted-foreground">
          Manage your profile information and security settings.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 pt-4">
          <nav className="flex gap-6 text-subtext">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'border-b-2 border-transparent pb-3 text-subtext font-medium text-muted-foreground transition-colors',
                activeTab === 'profile' && 'border-primary text-foreground'
              )}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={cn(
                'border-b-2 border-transparent pb-3 text-subtext font-medium text-muted-foreground transition-colors',
                activeTab === 'audit' && 'border-primary text-foreground'
              )}
            >
              Audit
            </button>
          </nav>
        </div>

        <div className="px-6 pb-6 pt-4">
          {activeTab === 'profile' ? (
            <form
              className="space-y-6"
              onSubmit={handleProfileSubmit}
              noValidate
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="relative flex size-20 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground">
                    {isLoading
                      ? '…'
                      : user
                        ? user.name
                            .split(/\s+/)
                            .map(p => p[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '?'
                        : '?'}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      {isLoading ? 'Loading…' : (user?.name ?? 'User')}
                    </h2>
                    <p className="text-subtext text-muted-foreground">
                      Role:{' '}
                      {user
                        ? (roleLabels[user.user_type?.toLowerCase() ?? ''] ??
                          user.user_type)
                        : '—'}
                    </p>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Change Profile Picture
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="userId"
                      className="text-subtext font-medium text-foreground"
                    >
                      User ID
                    </label>
                    <input
                      id="userId"
                      type="text"
                      {...profileForm.register('userId')}
                      disabled
                      className="block w-full rounded-md border border-border bg-muted/70 px-3 py-2 text-body text-muted-foreground shadow-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="username"
                      className="flex items-center gap-1 text-subtext font-medium text-foreground"
                    >
                      Username <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="username"
                      type="text"
                      {...profileForm.register('username')}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="flex items-center gap-1 text-subtext font-medium text-foreground"
                    >
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="phoneNumber"
                      className="flex items-center gap-1 text-subtext font-medium text-foreground"
                    >
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      {...profileForm.register('phoneNumber')}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                    />
                    {profileForm.formState.errors.phoneNumber && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="dateOfBirth"
                      className="text-subtext font-medium text-foreground"
                    >
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      {...profileForm.register('dateOfBirth')}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="mt-6 text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  Update Password
                </button>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelProfile}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-2 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Audit log
              </h2>
              <p className="max-w-2xl text-subtext text-muted-foreground">
                Audit history for this account will appear here once the
                activity tracking feature is implemented.
              </p>
            </div>
          )}
        </div>
      </section>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Update Password
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use a minimum of 8 characters with a mix of letters, numbers,
                  and special symbols to ensure better protection.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={handlePasswordSubmit}
              noValidate
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="currentPassword"
                  className="text-subtext font-medium text-foreground"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register('currentPassword')}
                  className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="newPassword"
                  className="text-subtext font-medium text-foreground"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword')}
                  className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmNewPassword"
                  className="text-subtext font-medium text-foreground"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('confirmNewPassword')}
                  className="block w-full rounded-md border border-border bg-background px-3 py-2 text-body text-foreground shadow-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
                {passwordForm.formState.errors.confirmNewPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmNewPassword.message}
                  </p>
                )}
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
