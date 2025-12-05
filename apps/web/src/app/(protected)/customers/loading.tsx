import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <Card className="glass-card">
        <div className="p-4 border-b border-white/10">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  )
}
