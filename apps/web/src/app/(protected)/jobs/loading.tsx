import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function JobsLoading() {
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(
          (tab) => (
            <Skeleton key={tab} className="h-9 w-24" />
          )
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
