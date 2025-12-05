import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function TimeGPSLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <Card className="glass-card p-4 lg:col-span-2">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </Card>

        {/* Team List */}
        <Card className="glass-card p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
