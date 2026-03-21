import type { FormHTMLAttributes, ReactNode } from 'react'
import type { FieldErrors } from 'react-hook-form'

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export function Form({
  children,
  onSubmit,
  className = '',
  ...props
}: FormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`} {...props}>
      {children}
    </form>
  )
}

export function FormActions({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}

export function FormErrorMessage({ errors }: { errors?: FieldErrors }) {
  if (!errors || Object.keys(errors).length === 0) return null

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <h4 className="mb-2 text-sm font-medium text-red-800">
        Please fix the following errors:
      </h4>
      <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>
            {field}: {error?.message as string}
          </li>
        ))}
      </ul>
    </div>
  )
}
