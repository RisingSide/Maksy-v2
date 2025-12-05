'use client'

import { useRef, useEffect, useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DayViewProps {
  date: string // e.g., "November 5, 2024"
  selectedDate: number // e.g., 5
  onOpenModal?: (type: 'job' | 'task' | 'meeting') => void
}

export function DayView({ date, selectedDate, onOpenModal }: DayViewProps) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 10 PM
  const cellHeight = 80 // min-h-[80px] - standardized to match WeekView

  // Dynamic header height calculation for accurate event positioning
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(80) // Default 80px

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [])

  // Helper function to calculate event position and height
  const calculateEventPosition = (
    startHour: number,
    startMin: number,
    endHour: number,
    endMin: number
  ) => {
    // Each hour slot has min-h-[80px] for day view (standardized with WeekView)
    // We calculate position based on minutes for accurate alignment
    const minutesPerHour = 60

    // Calculate start position in pixels from 8:00 AM
    const startMinutes = (startHour - 8) * minutesPerHour + startMin
    const startPosition = (startMinutes / minutesPerHour) * cellHeight

    // Calculate end position
    const endMinutes = (endHour - 8) * minutesPerHour + endMin
    const endPosition = (endMinutes / minutesPerHour) * cellHeight

    const height = endPosition - startPosition
    return { top: startPosition, height: Math.max(height, 40) } // Minimum 40px height
  }

  // Sample jobs with full time information
  const sampleJobs = [
    {
      startHour: 10,
      startMin: 0,
      endHour: 11,
      endMin: 30,
      title: 'AC Repair',
      customer: 'John Doe',
      color: 'from-blue-500 to-blue-600',
    },
    {
      startHour: 14,
      startMin: 0,
      endHour: 15,
      endMin: 0,
      title: 'Pool Cleaning',
      customer: 'Alice Brown',
      color: 'from-primary to-orange-600',
    },
    {
      startHour: 9,
      startMin: 0,
      endHour: 10,
      endMin: 0,
      title: 'Lawn Mowing',
      customer: 'Bob Wilson',
      color: 'from-purple-500 to-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden">
      {/* Time column */}
      <div className="bg-card/50 border-r border-border">
        <div className="p-4 border-b border-border">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        {hours.map((hour) => (
          <div
            key={hour}
            className="p-4 text-right min-h-[80px] hover:bg-accent/30 cursor-pointer transition-colors relative group"
          >
            <span className="text-sm text-muted-foreground">
              {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
            </span>
            {/* Hover add button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <DropdownMenuItem onClick={() => onOpenModal?.('job')}>
                    Add Job
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenModal?.('task')}>
                    Add Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenModal?.('meeting')}>
                    Add Meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule column */}
      <div className="bg-card/50 relative">
        <div ref={headerRef} className="p-4 border-b border-border text-center">
          <p className="text-sm font-medium">{date}</p>
          <p className="text-2xl font-bold text-primary">{selectedDate}</p>
        </div>
        {hours.map((hour) => (
          <div
            key={hour}
            className="p-2 min-h-[80px] hover:bg-accent/30 cursor-pointer transition-colors relative group"
          >
            {/* Hover add button */}
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
                  <DropdownMenuItem onClick={() => onOpenModal?.('job')}>
                    Add Job
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenModal?.('task')}>
                    Add Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenModal?.('meeting')}>
                    Add Meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {/* Events positioned absolutely within schedule column */}
        {sampleJobs.map((job, jobIndex) => {
          const { top, height } = calculateEventPosition(
            job.startHour,
            job.startMin,
            job.endHour,
            job.endMin
          )
          const startTime = `${job.startHour > 12 ? job.startHour - 12 : job.startHour}:${job.startMin.toString().padStart(2, '0')} ${job.startHour >= 12 ? 'PM' : 'AM'}`
          const endTime = `${job.endHour > 12 ? job.endHour - 12 : job.endHour}:${job.endMin.toString().padStart(2, '0')} ${job.endHour >= 12 ? 'PM' : 'AM'}`

          return (
            <div
              key={`job-${jobIndex}`}
              className={`absolute left-2 right-2 bg-gradient-to-br ${job.color} rounded-lg p-3 text-white text-sm shadow-lg z-10 cursor-pointer hover:opacity-90 transition-opacity`}
              style={{
                top: `${headerHeight + top}px`,
                height: `${height}px`,
              }}
            >
              <p className="font-semibold">{job.title}</p>
              <p className="opacity-90 text-xs mt-1">{job.customer}</p>
              <p className="opacity-75 text-xs mt-1">
                {startTime} - {endTime}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
