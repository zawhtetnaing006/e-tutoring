import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'floating'
}

export function Toolbar({
  variant = 'default',
  className,
  children,
  ...rest
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Editor toolbar"
      data-variant={variant}
      className={cn('tiptap-toolbar', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="tiptap-toolbar-group">{children}</div>
}

export interface ToolbarSeparatorProps {
  orientation?: 'horizontal' | 'vertical'
}

export function ToolbarSeparator({
  orientation = 'vertical',
}: ToolbarSeparatorProps) {
  return (
    <div
      className="tiptap-toolbar-separator"
      data-orientation={orientation}
      role="separator"
      aria-orientation={orientation}
    />
  )
}
