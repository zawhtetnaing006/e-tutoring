import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type DashboardViewAllLinkProps = {
  to: string
  children?: ReactNode
}

export function DashboardViewAllLink({
  to,
  children = 'View All →',
}: DashboardViewAllLinkProps) {
  return (
    <Link
      to={to}
      className="self-start text-sm font-medium text-blue-600 underline-offset-4 hover:underline sm:self-auto"
    >
      {children}
    </Link>
  )
}
