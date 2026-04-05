import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

const DropdownContext = createContext<{ close: () => void } | null>(null)

export interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const close = () => setIsOpen(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="w-full"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {trigger}
        </button>

        {isOpen && (
          <div
            className={`absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            role="menu"
          >
            <div className="py-1">{children}</div>
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  )
}

export interface DropdownItemProps {
  onClick?: () => void
  icon?: ReactNode
  children: ReactNode
  variant?: 'default' | 'danger' | 'success'
  disabled?: boolean
}

const VARIANT_CLASSES = {
  default: 'text-gray-700 hover:bg-gray-100',
  success: 'text-green-600 hover:bg-green-50',
  danger: 'text-red-600 hover:bg-red-50',
} as const

export function DropdownItem({
  onClick,
  icon,
  children,
  variant = 'default',
  disabled = false,
}: DropdownItemProps) {
  const context = useContext(DropdownContext)
  // eslint-disable-next-line security/detect-object-injection
  const variantClasses = VARIANT_CLASSES[variant]

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.()
    context?.close()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${variantClasses} disabled:cursor-not-allowed disabled:opacity-50`}
      role="menuitem"
    >
      {icon}
      {children}
    </button>
  )
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-200" />
}
