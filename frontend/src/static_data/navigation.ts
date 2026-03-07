import {
  BookOpen,
  CalendarRange,
  LayoutDashboard,
  UsersRound,
  Newspaper,
  Bell,
  CalendarClock,
  MessagesSquare,
  UserPen,
  FileClock,
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
      {
        name: 'Meeting Manager',
        href: '/meeting-manager',
        icon: CalendarClock,
      },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
      {
        name: 'Communication Hub',
        href: '/communication-hub',
        icon: MessagesSquare,
      },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Audit Log', href: '/audit-log', icon: FileClock },
      { name: 'Profile', href: '/profile', icon: UserPen },
    ],
  },
]

const studentSidebarNavigation: NavSection[] = [
  {
    title: 'Main Menu',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      {
        name: 'Meeting Manager',
        href: '/meeting-manager',
        icon: CalendarClock,
      },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
      {
        name: 'Communication Hub',
        href: '/communication-hub',
        icon: MessagesSquare,
      },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Profile', href: '/profile', icon: UserPen },
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
      {
        name: 'Meeting Manager',
        href: '/meeting-manager',
        icon: CalendarClock,
      },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
      {
        name: 'Communication Hub',
        href: '/communication-hub',
        icon: MessagesSquare,
      },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Profile', href: '/profile', icon: UserPen },
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
