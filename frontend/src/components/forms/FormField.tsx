import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  helpText?: string
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
  helpText,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn
  error?: string
}

export function Input({ register, error, className, ...props }: InputProps) {
  return (
    <input
      {...register}
      {...props}
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
    />
  )
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  register?: UseFormRegisterReturn
  error?: string
}

export function Textarea({
  register,
  error,
  className,
  ...props
}: TextareaProps) {
  return (
    <textarea
      {...register}
      {...props}
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
    />
  )
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  register?: UseFormRegisterReturn
  error?: string
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

export function Select({
  register,
  error,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      {...register}
      {...props}
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn
  label: string
  error?: string
}

export function Checkbox({
  register,
  label,
  error,
  className,
  ...props
}: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        {...register}
        {...props}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
          error && 'border-red-500',
          className
        )}
      />
      <label className="text-sm text-gray-700">{label}</label>
    </div>
  )
}

export interface RadioGroupProps {
  name: string
  options: Array<{ value: string | number; label: string }>
  register?: UseFormRegisterReturn
  error?: string
  className?: string
}

export function RadioGroup({
  name,
  options,
  register,
  error,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {options.map(option => (
        <div key={option.value} className="flex items-center gap-2">
          <input
            type="radio"
            {...register}
            value={option.value}
            id={`${name}-${option.value}`}
            className={cn(
              'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
              error && 'border-red-500'
            )}
          />
          <label
            htmlFor={`${name}-${option.value}`}
            className="text-sm text-gray-700"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}
