import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function AutomationsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
