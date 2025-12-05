import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function ServicesLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-52" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 flex-shrink-0" />
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
