import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { List, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
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
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Meeting Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your tutoring sessions
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </button>
      </div>

      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === 'month'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === 'week'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === 'day'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Day
            </button>
            <div className="mx-2 h-6 w-px bg-border" />
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          {viewMode !== 'list' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleToday}
                className="rounded-md bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode !== 'list' && (
        <div className="border-b border-border bg-card px-6 py-3">
          <h2 className="text-lg font-semibold text-foreground">
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

      {isCreateOpen && (
        <CreateMeetingModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false)
            void queryClient.invalidateQueries({ queryKey: ['meetings'] })
          }}
        />
      )}

      {editingMeeting && (
        <EditMeetingModal
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
          meeting={selectedMeeting}
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
