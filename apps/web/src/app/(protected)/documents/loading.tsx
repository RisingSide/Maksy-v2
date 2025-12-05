import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Folders */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card p-4 text-center">
            <Skeleton className="h-12 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </Card>
        ))}
      </div>

      {/* Documents List */}
      <Card className="glass-card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
            >
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
