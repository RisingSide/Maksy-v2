import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* View Toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Calendar Grid */}
      <Card className="glass-card p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center">
              <Skeleton className="h-4 w-10 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square p-2 rounded-lg bg-white/5">
              <Skeleton className="h-4 w-6 mb-2" />
              <div className="space-y-1">
                {i % 3 === 0 && <Skeleton className="h-5 w-full rounded" />}
                {i % 5 === 0 && <Skeleton className="h-5 w-full rounded" />}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Upcoming Events Sidebar (if visible) */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="glass-card p-4 lg:col-span-1">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
              >
                <Skeleton className="h-10 w-1 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
