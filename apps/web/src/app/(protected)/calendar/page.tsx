'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DayView } from '@/components/calendar/DayView'
import { MonthView } from '@/components/calendar/MonthView'
import { AddJobModal } from '@/components/calendar/AddJobModal'
import { AddTaskModal } from '@/components/calendar/AddTaskModal'
import { AddMeetingModal } from '@/components/calendar/AddMeetingModal'
import { AddServiceModal } from '@/components/calendar/AddServiceModal'
import { useJobs, Job } from '@/hooks/use-jobs'
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns'

type ViewType = 'day' | 'week' | 'month'
type ModalType = 'job' | 'task' | 'meeting' | 'service' | null

// Status colors for jobs
const statusColors: Record<Job['status'], string> = {
  scheduled: 'from-blue-500 to-blue-600',
  confirmed: 'from-purple-500 to-purple-600',
  in_progress: 'from-primary to-orange-600',
  completed: 'from-green-500 to-green-600',
  cancelled: 'from-gray-400 to-gray-500',
}

export default function CalendarPage() {
  const [currentView, setCurrentView] = useState<ViewType>('week')
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    if (currentView === 'day') {
      return {
        start: format(currentDate, 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }
    } else if (currentView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd'),
      }
    } else {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      return {
        start: format(monthStart, 'yyyy-MM-dd'),
        end: format(monthEnd, 'yyyy-MM-dd'),
      }
    }
  }, [currentDate, currentView])

  // Fetch jobs for the current date range
  const { jobs, isLoading, refetch } = useJobs({
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 100,
  })

  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 10 PM

  // Get week days for the current week
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [currentDate])

  // Navigation handlers
  const goToToday = () => setCurrentDate(new Date())

  const goToPrevious = () => {
    if (currentView === 'day') {
      setCurrentDate(addDays(currentDate, -1))
    } else if (currentView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const goToNext = () => {
    if (currentView === 'day') {
      setCurrentDate(addDays(currentDate, 1))
    } else if (currentView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  // Helper function to calculate event position and height
  const calculateEventPosition = (
    startHour: number,
    startMin: number,
    endHour: number,
    endMin: number
  ) => {
    const cellHeight = 80
    const minutesPerHour = 60

    const startMinutes = (startHour - 8) * minutesPerHour + startMin
    const startPosition = (startMinutes / minutesPerHour) * cellHeight

    const endMinutes = (endHour - 8) * minutesPerHour + endMin
    const endPosition = (endMinutes / minutesPerHour) * cellHeight

    const height = endPosition - startPosition
    return { top: startPosition, height: Math.max(height, 40) }
  }

  // Parse time string to hours and minutes with error handling
  const parseTime = (timeStr: string | null | undefined) => {
    // Default to 9:00 AM if time is missing or invalid
    if (!timeStr || typeof timeStr !== 'string') {
      return { hours: 9, minutes: 0 }
    }

    const parts = timeStr.split(':')
    if (parts.length < 2) {
      return { hours: 9, minutes: 0 }
    }

    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)

    // Validate parsed values are valid numbers
    if (isNaN(hours) || isNaN(minutes)) {
      return { hours: 9, minutes: 0 }
    }

    // Clamp to valid ranges
    return {
      hours: Math.max(0, Math.min(23, hours)),
      minutes: Math.max(0, Math.min(59, minutes)),
    }
  }

  // Get jobs for a specific day
  const getJobsForDay = (date: Date) => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.scheduledDate)
      return isSameDay(jobDate, date)
    })
  }

  const handleOpenModal = (type: ModalType) => {
    setOpenModal(type)
  }

  const handleCloseModal = () => {
    setOpenModal(null)
    refetch()
  }

  // Week View Component
  const WeekView = () => {
    const headerRef = useRef<HTMLDivElement>(null)

    if (isLoading) {
      return (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading schedule...
            </span>
          </div>
        </Card>
      )
    }

    return (
      <Card className="glass-card p-0 overflow-hidden border border-border">
        <div
          ref={headerRef}
          className="grid grid-cols-8 border-b border-border"
        >
          {/* Time column header */}
          <div className="p-4 border-r border-border bg-card/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Day headers */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={day.toISOString()}
                className={`p-4 text-center border-r border-border last:border-r-0 ${isToday ? 'bg-primary/5' : 'bg-card/50'}`}
              >
                <p className="text-sm font-medium">{format(day, 'EEE')}</p>
                <p
                  className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}
                >
                  {format(day, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Calendar grid with day columns as containers */}
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r border-border">
            {hours.map((hour) => (
              <div
                key={`time-${hour}`}
                className="p-4 text-right border-r border-border bg-card/50 min-h-[80px]"
              >
                <span className="text-sm text-muted-foreground">
                  {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns with events */}
          {weekDays.map((day) => {
            const dayJobs = getJobsForDay(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`relative border-r border-border last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}
              >
                {/* Time slot cells */}
                {hours.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="p-2 min-h-[80px] hover:bg-accent/30 cursor-pointer transition-colors relative group"
                  >
                    {/* Hover add button with dropdown */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shadow-lg bg-background"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="glass-dropdown-solid"
                          align="center"
                        >
                          <DropdownMenuItem
                            onClick={() => handleOpenModal('job')}
                          >
                            Add Job
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenModal('task')}
                          >
                            Add Task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenModal('meeting')}
                          >
                            Add Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {/* Events positioned absolutely within day column */}
                {dayJobs.map((job) => {
                  const { hours: startHour, minutes: startMin } = parseTime(
                    job.scheduledTime
                  )

                  // Calculate end time with proper minute overflow handling
                  const totalEndMinutes = startMin + job.durationMinutes
                  const endHour = startHour + Math.floor(totalEndMinutes / 60)
                  const endMin = totalEndMinutes % 60

                  const { top, height } = calculateEventPosition(
                    startHour,
                    startMin,
                    endHour,
                    endMin
                  )

                  // Format times for display (handle 12-hour format, midnight/noon, and day overflow)
                  const formatHour = (h: number) => {
                    // Normalize to 0-23 range first (handle jobs spanning midnight)
                    const normalizedHour = ((h % 24) + 24) % 24
                    if (normalizedHour === 0) return 12 // Midnight
                    if (normalizedHour === 12) return 12 // Noon
                    if (normalizedHour > 12) return normalizedHour - 12
                    return normalizedHour
                  }
                  const getAmPm = (h: number) => {
                    const normalizedHour = ((h % 24) + 24) % 24
                    return normalizedHour >= 12 ? 'PM' : 'AM'
                  }
                  const startTime = `${formatHour(startHour)}:${startMin.toString().padStart(2, '0')} ${getAmPm(startHour)}`
                  const endTime = `${formatHour(endHour)}:${endMin.toString().padStart(2, '0')} ${getAmPm(endHour)}`

                  const customerName = job.customer
                    ? `${job.customer.firstName} ${job.customer.lastName}`
                    : 'Unknown Customer'

                  return (
                    <div
                      key={job.id}
                      className={`absolute left-2 right-2 bg-gradient-to-br ${statusColors[job.status]} rounded-lg p-2 text-white text-xs shadow-lg z-10 cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                    >
                      <p className="font-semibold truncate">
                        {job.service?.name || 'Service'}
                      </p>
                      <p className="opacity-90 truncate">{customerName}</p>
                      <p className="opacity-75">
                        {startTime} - {endTime}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  // Format display text based on view
  const getDisplayText = () => {
    if (currentView === 'day') {
      return {
        title: format(currentDate, 'MMMM d, yyyy'),
        subtitle: format(currentDate, 'EEEE'),
      }
    } else if (currentView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return {
        title: format(currentDate, 'MMMM yyyy'),
        subtitle: `Week ${format(currentDate, 'w')} · ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
      }
    } else {
      return {
        title: format(currentDate, 'MMMM yyyy'),
        subtitle: 'Full Month',
      }
    }
  }

  const displayText = getDisplayText()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and appointments
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="shadow-lg gap-2">
                <Plus className="h-4 w-4" />
                Schedule
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-dropdown-solid" align="end">
              <DropdownMenuItem onClick={() => handleOpenModal('job')}>
                Add Job
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenModal('task')}>
                Add Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenModal('meeting')}>
                Add Meeting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[200px]">
              <h2 className="text-lg font-semibold">{displayText.title}</h2>
              <p className="text-sm text-muted-foreground">
                {displayText.subtitle}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            value={currentView}
            onValueChange={(value) => setCurrentView(value as ViewType)}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" onClick={goToToday}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
      </Card>

      {/* Calendar Views */}
      {currentView === 'day' && (
        <DayView
          date={format(currentDate, 'MMMM yyyy')}
          selectedDate={parseInt(format(currentDate, 'd'))}
          onOpenModal={(type) => handleOpenModal(type)}
        />
      )}
      {currentView === 'week' && <WeekView />}
      {currentView === 'month' && (
        <Card className="glass-card p-0 overflow-hidden border border-border">
          <MonthView month={format(currentDate, 'MMMM yyyy')} />
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">Status:</p>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
          <span className="text-sm">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500"></div>
          <span className="text-sm">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary"></div>
          <span className="text-sm">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Completed</span>
        </div>
      </div>

      {/* Modals */}
      <AddJobModal
        open={openModal === 'job'}
        onOpenChange={(open) => !open && handleCloseModal()}
      />
      <AddTaskModal
        open={openModal === 'task'}
        onOpenChange={(open) => !open && handleCloseModal()}
      />
      <AddMeetingModal
        open={openModal === 'meeting'}
        onOpenChange={(open) => !open && handleCloseModal()}
      />
      <AddServiceModal
        open={openModal === 'service'}
        onOpenChange={(open) => !open && handleCloseModal()}
      />
    </div>
  )
}
