import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TiptapButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style'
> {
  'data-style'?: 'ghost' | 'primary'
  'data-active-state'?: 'on' | 'off'
  'data-size'?: 'small' | 'default'
  'data-appearance'?: string
  tooltip?: string
  shortcutKeys?: string
  children: ReactNode
}

export function TiptapButton({
  'data-style': dataStyle = 'ghost',
  'data-active-state': activeState,
  'data-size': dataSize = 'default',
  'data-appearance': dataAppearance,
  tooltip,
  shortcutKeys,
  className,
  disabled,
  children,
  ...rest
}: TiptapButtonProps) {
  const title =
    tooltip != null && tooltip !== ''
      ? `${tooltip}${shortcutKeys ? ` (${shortcutKeys})` : ''}`
      : undefined

  const ariaPressed =
    activeState === 'on' ? true : activeState === 'off' ? false : undefined

  return (
    <button
      type="button"
      data-style={dataStyle}
      data-active-state={activeState}
      data-size={dataSize}
      data-appearance={dataAppearance}
      data-disabled={disabled ? 'true' : undefined}
      disabled={disabled}
      title={title}
      aria-pressed={ariaPressed}
      className={cn('tiptap-button', className)}
      {...rest}
    >
      {children}
    </button>
  )
}
