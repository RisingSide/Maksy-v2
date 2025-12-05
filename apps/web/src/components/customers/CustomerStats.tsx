'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Customer } from '@/hooks/use-customers'

interface CustomerStatsProps {
  customers: Customer[]
  total: number
  isLoading: boolean
}

export function CustomerStats({
  customers,
  total,
  isLoading,
}: CustomerStatsProps) {
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

  // Calculate stats from actual data
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const activeThisMonth = customers.filter((c) => {
    if (!c.lastJobDate) return false
    return new Date(c.lastJobDate) >= thirtyDaysAgo
  }).length

  const newThisWeek = customers.filter((c) => {
    return new Date(c.createdAt) >= sevenDaysAgo
  }).length

  const totalLtv = customers.reduce((sum, c) => {
    return sum + parseFloat(c.lifetimeValue || '0')
  }, 0)

  const avgLtv = customers.length > 0 ? totalLtv / customers.length : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const activeRate =
    total > 0 ? ((activeThisMonth / total) * 100).toFixed(1) : '0'

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
        <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        <p className="text-xs text-green-600 mt-1">+{newThisWeek} this week</p>
      </Card>
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Active This Month</p>
        <p className="text-2xl font-bold">{activeThisMonth}</p>
        <p className="text-xs text-blue-600 mt-1">{activeRate}% active rate</p>
      </Card>
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">Avg Lifetime Value</p>
        <p className="text-2xl font-bold">{formatCurrency(avgLtv)}</p>
        <p className="text-xs text-purple-600 mt-1">
          {formatCurrency(totalLtv)} total
        </p>
      </Card>
      <Card className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-1">New This Week</p>
        <p className="text-2xl font-bold">{newThisWeek}</p>
        <p className="text-xs text-orange-600 mt-1">
          {total > 0 ? ((newThisWeek / total) * 100).toFixed(1) : '0'}% of total
        </p>
      </Card>
    </div>
  )
}
