import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function InvoicesLoading() {
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map((tab) => (
          <Skeleton key={tab} className="h-9 w-20" />
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="grid grid-cols-7 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-7 gap-4 items-center">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
