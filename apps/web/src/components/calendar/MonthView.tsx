'use client'

import { Badge } from '@/components/ui/badge'

interface MonthViewProps {
  month: string // e.g., "November 2024"
}

export function MonthView({ month }: MonthViewProps) {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Generate calendar days (simplified - showing first 28 days for demo)
  // In a real implementation, this would calculate based on the actual month
  const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1)

  // Sample jobs per day (hardcoded for demo)
  const jobsPerDay: Record<number, number> = {
    5: 2, // 2 jobs on the 5th
    7: 1, // 1 job on the 7th
    10: 3, // 3 jobs on the 10th
    14: 1, // 1 job on the 14th
    18: 2, // 2 jobs on the 18th
    22: 1, // 1 job on the 22nd
    25: 4, // 4 jobs on the 25th
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden">
      {/* Day headers */}
      {daysOfWeek.map((day) => (
        <div
          key={day}
          className="p-3 text-center bg-card/50 border-b border-border"
        >
          <p className="text-sm font-medium text-muted-foreground">{day}</p>
        </div>
      ))}

      {/* Calendar days */}
      {calendarDays.map((day) => {
        const jobCount = jobsPerDay[day] || 0
        const isToday = day === 5 // Hardcoded for demo - in real app, check against current date

        return (
          <div
            key={day}
            className={`p-2 min-h-[100px] bg-card/50 border-b border-border hover:bg-accent/30 cursor-pointer transition-colors relative ${
              isToday ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}
              >
                {day}
              </span>
              {jobCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {jobCount}
                </Badge>
              )}
            </div>

            {/* Job dots (visual indicator) */}
            {jobCount > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {Array.from({ length: Math.min(jobCount, 3) }).map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-primary" />
                ))}
                {jobCount > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{jobCount - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
