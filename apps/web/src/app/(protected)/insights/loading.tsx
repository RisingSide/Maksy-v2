import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function InsightsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* AI Insights Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card className="glass-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-lg bg-white/5"
            >
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
