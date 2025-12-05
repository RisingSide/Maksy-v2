import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Inventory Table */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
            >
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
