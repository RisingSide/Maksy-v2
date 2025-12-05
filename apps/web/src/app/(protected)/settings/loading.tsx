import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(12)].map((_, i) => (
          <Card
            key={i}
            className="glass-card p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
