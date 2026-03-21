import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  onClear?: () => void
  showClearButton?: boolean
  /** Merged with default input styles (theme-friendly overrides). */
  inputClassName?: string
  /** Optional class for the leading search icon. */
  iconClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className = '',
      inputClassName,
      iconClassName,
      value,
      onClear,
      showClearButton = true,
      ...props
    },
    ref
  ) => {
    const hasValue = value && String(value).length > 0

    return (
      <div className={cn('relative', className)}>
        <Search
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400',
            iconClassName
          )}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            'h-10 w-full rounded-md border border-gray-300 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            inputClassName
          )}
          {...props}
        />
        {showClearButton && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
