import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  side = 'right',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return

    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (side) {
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 12
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - 12
          break
        case 'top':
          top = rect.top - 12
          left = rect.left + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + 12
          left = rect.left + rect.width / 2
          break
      }

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, side])

  if (disabled) {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'fixed z-[100] rounded-lg border border-gray-800 bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white shadow-xl',
            'pointer-events-none whitespace-nowrap',
            side === 'right' && '-translate-y-1/2',
            side === 'left' && '-translate-x-full -translate-y-1/2',
            side === 'top' && '-translate-x-1/2 -translate-y-full',
            side === 'bottom' && '-translate-x-1/2'
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              'absolute h-3 w-3 rotate-45 border-l border-t border-gray-800 bg-[#1a1a1a]',
              side === 'right' && '-left-1.5 top-1/2 -translate-y-1/2',
              side === 'left' &&
                '-right-1.5 top-1/2 -translate-y-1/2 border-b border-l-0 border-r border-t-0',
              side === 'top' &&
                '-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-l-0 border-r border-t-0',
              side === 'bottom' && '-top-1.5 left-1/2 -translate-x-1/2'
            )}
          />
        </div>
      )}
    </>
  )
}
