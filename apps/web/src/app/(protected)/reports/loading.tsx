import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card p-6 lg:col-span-2">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-80 w-full" />
        </Card>
        <Card className="glass-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
