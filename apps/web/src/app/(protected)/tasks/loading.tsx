import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Kanban Columns */}
      <div className="grid gap-4 md:grid-cols-4">
        {['To Do', 'In Progress', 'Review', 'Done'].map((column) => (
          <Card key={column} className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-3 bg-white/5">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
