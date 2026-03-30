import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { List, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { getAuthSession } from '@/features/auth/storage'
import { getUserRole } from '@/features/auth/role-utils'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useMeetings } from '@/features/meetings/useMeetings'
import { type Meeting } from '@/features/meetings/api'
import { CreateMeetingModal } from './components/CreateMeetingModal'
import { EditMeetingModal } from './components/EditMeetingModal'
import { MeetingDetailModal } from './components/MeetingDetailModal'
import { CalendarView } from './components/CalendarView'
import { ListView } from './components/ListView'

export type ViewMode = 'month' | 'week' | 'day' | 'list'

export function MeetingManagerPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  const meetingsQuery = useMeetings({ per_page: 1000 })
  const currentUserQuery = useCurrentUser()
  const effectiveUser = currentUserQuery.data ?? getAuthSession()?.user ?? null
  const role = getUserRole(effectiveUser)
  const isStudent = role === 'student'
  const canManageMeetings = role === 'staff' || role === 'tutor'

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const currentMonthYear = useMemo(() => {
    return currentDate.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }, [currentDate])

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Meeting Manager
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isStudent
              ? 'View your scheduled sessions'
              : 'Manage your tutoring sessions'}
          </p>
        </div>
        {canManageMeetings && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:justify-start"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Meeting</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      <div className="border-b border-border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto sm:gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                viewMode === 'month'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                viewMode === 'week'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                viewMode === 'day'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Day
            </button>
            <div className="mx-1 h-6 w-px bg-border sm:mx-2" />
            <button
              onClick={() => setViewMode('list')}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium sm:gap-2 sm:px-3 sm:text-sm ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              List
            </button>
          </div>

          {viewMode !== 'list' && (
            <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
              <button
                onClick={handlePrevious}
                className="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={handleToday}
                className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 sm:px-4 sm:text-sm"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode !== 'list' && (
        <div className="border-b border-border bg-card p-3">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {currentMonthYear}
          </h2>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-background">
        {viewMode === 'list' ? (
          <ListView
            meetings={meetingsQuery.data?.data ?? []}
            isLoading={meetingsQuery.isLoading}
            onViewDetails={setSelectedMeeting}
            isStudent={isStudent}
          />
        ) : (
          <CalendarView
            viewMode={viewMode}
            currentDate={currentDate}
            meetings={meetingsQuery.data?.data ?? []}
            isLoading={meetingsQuery.isLoading}
            onViewDetails={setSelectedMeeting}
          />
        )}
      </div>

      {isCreateOpen && canManageMeetings && (
        <CreateMeetingModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false)
            void queryClient.invalidateQueries({ queryKey: ['meetings'] })
          }}
        />
      )}

      {editingMeeting && canManageMeetings && (
        <EditMeetingModal
          key={editingMeeting.id}
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
          onSuccess={() => {
            setEditingMeeting(null)
            void queryClient.invalidateQueries({ queryKey: ['meetings'] })
          }}
        />
      )}

      {selectedMeeting && (
        <MeetingDetailModal
          key={selectedMeeting.id}
          meeting={selectedMeeting}
          canManageMeeting={canManageMeetings}
          onClose={() => setSelectedMeeting(null)}
          onEdit={() => {
            setEditingMeeting(selectedMeeting)
            setSelectedMeeting(null)
          }}
        />
      )}
    </div>
  )
}
