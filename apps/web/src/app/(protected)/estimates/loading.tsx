import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function EstimatesLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {['All', 'Draft', 'Sent', 'Approved', 'Declined'].map((tab) => (
          <Skeleton key={tab} className="h-9 w-24" />
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
