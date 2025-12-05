'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Service, ServiceCategory } from '@/hooks/use-services'

interface ServiceStatsProps {
  services: Service[]
  categories: ServiceCategory[]
  total: number
  isLoading: boolean
}

export function ServiceStats({
  services,
  categories,
  total,
  isLoading,
}: ServiceStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-1" />
          </Card>
        ))}
      </div>
    )
  }

  // Calculate stats
  const publicServices = services.filter((s) => s.isPublic).length
  const totalPrice = services.reduce(
    (sum, s) => sum + parseFloat(s.price || '0'),
    0
  )
  const avgPrice = services.length > 0 ? totalPrice / services.length : 0

  // Find most popular (for now, just the first one - could be based on bookings later)
  const mostPopular = services[0]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const avgDuration =
    services.length > 0
      ? Math.round(
          services.reduce((sum, s) => sum + s.durationMinutes, 0) /
            services.length
        )
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Total Services</p>
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {categories.length} categories
        </p>
      </Card>
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Public Services</p>
        <p className="text-2xl font-bold">{publicServices}</p>
        <p className="text-xs text-blue-600 mt-1">On booking page</p>
      </Card>
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Avg Price</p>
        <p className="text-2xl font-bold">{formatCurrency(avgPrice)}</p>
        <p className="text-xs text-green-600 mt-1">
          Avg duration: {avgDuration}min
        </p>
      </Card>
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Most Popular</p>
        <p className="text-lg font-bold truncate">
          {mostPopular?.name || 'N/A'}
        </p>
        <p className="text-xs text-primary mt-1">
          {mostPopular ? formatCurrency(parseFloat(mostPopular.price)) : '-'}
        </p>
      </Card>
    </div>
  )
}
