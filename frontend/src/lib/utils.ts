import { type ClassValue, clsx } from 'clsx'
import { type VariantProps, cva } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind conflict resolution.
 * Used by shadcn/ui and across the app.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build variant-based class names (class-variance-authority).
 * Use for components with variants, e.g. button sizes, states.
 *
 * @example
 * const buttonVariants = cva('base-classes', {
 *   variants: { size: { sm: '...', lg: '...' } },
 *   defaultVariants: { size: 'sm' }
 * })
 * <button className={buttonVariants({ size: 'lg' })} />
 */
export { cva, type VariantProps }
