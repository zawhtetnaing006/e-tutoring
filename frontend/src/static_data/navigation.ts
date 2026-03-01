import {
  BookOpen,
  CalendarRange,
  LayoutDashboard,
  UsersRound,
  Newspaper,
  Bell,
  Settings2,
  type LucideIcon,
} from 'lucide-react'
import type { AuthRole } from '@/features/auth'

export type NavSection = {
  title: string
  items: { name: string; href: string; icon?: LucideIcon }[]
}

const staffSidebarNavigation: NavSection[] = [
  {
    title: 'Main Menu',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Staffs', href: '/staffs', icon: UsersRound },
      { name: 'Tutors', href: '/tutors', icon: UsersRound },
      { name: 'Students', href: '/students', icon: UsersRound },
      { name: 'Subjects', href: '/subjects', icon: BookOpen },
      {
        name: 'Allocation & Scheduling',
        href: '/allocations',
        icon: CalendarRange,
      },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings2 },
    ],
  },
]

const studentSidebarNavigation: NavSection[] = [
  {
    title: 'Main Menu',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings2 },
    ],
  },
]

const tutorSidebarNavigation: NavSection[] = [
  {
    title: 'Main Menu',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      {
        name: 'Allocation & Scheduling',
        href: '/allocations',
        icon: CalendarRange,
      },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings2 },
    ],
  },
]

/** Role-based sidebar navigation for the single dashboard layout. */
export function getSidebarNavigation(role: AuthRole): NavSection[] {
  switch (role) {
    case 'staff':
      return staffSidebarNavigation
    case 'student':
      return studentSidebarNavigation
    case 'tutor':
      return tutorSidebarNavigation
    default:
      return studentSidebarNavigation
  }
}
