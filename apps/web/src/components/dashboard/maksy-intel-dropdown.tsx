'use client'

import { Sparkles, TrendingUp, Zap, AlertCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MaksyIntelDropdown({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[900px] glass-card p-0 border border-border/40 backdrop-blur-xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-br from-purple-500/10 to-white/10 dark:from-purple-500/20 dark:to-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-semibold text-foreground">
              Maksy Intel
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            AI-Powered
          </Badge>
        </div>

        {/* Horizontal Grid Layout - 4 Cards */}
        <div className="grid grid-cols-4 gap-4 p-6">
          {/* Card 1: Insights */}
          <Card className="glass-card p-4 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 dark:border-blue-500/30 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-foreground">Insights</p>
            </div>
            <div className="space-y-2 mb-3 flex-1">
              <p className="text-xs text-foreground">
                Revenue trending{' '}
                <span className="font-semibold text-green-500">+15%</span> above
                last month
              </p>
              <p className="text-xs text-muted-foreground">
                2 high-value customers haven&apos;t rebooked yet
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              View Details →
            </Button>
          </Card>

          {/* Card 2: At-Risk Customers (NEW!) */}
          <Card className="glass-card p-4 bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20 dark:border-purple-500/30 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-semibold text-foreground">
                At-Risk Customers
              </p>
            </div>
            <div className="space-y-2 mb-3 flex-1">
              <p className="text-xs text-foreground">
                <span className="font-semibold text-amber-500">
                  12 customers
                </span>{' '}
                may churn
              </p>
              <p className="text-xs text-muted-foreground">
                14% retention rate is below your 86% average
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              View List →
            </Button>
          </Card>

          {/* Card 3: Optimizations */}
          <Card className="glass-card p-4 bg-green-500/5 dark:bg-green-500/10 border-green-500/20 dark:border-green-500/30 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-green-500" />
              <p className="text-sm font-semibold text-foreground">
                Optimizations
              </p>
            </div>
            <div className="space-y-2 mb-3 flex-1">
              <p className="text-xs text-foreground">
                Tuesday schedule{' '}
                <span className="font-semibold text-amber-500">
                  overloaded by 25%
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Route optimization available for 3 jobs
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8">
                Route
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8">
                Schedule
              </Button>
            </div>
          </Card>

          {/* Card 4: Actions Needed */}
          <Card className="glass-card p-4 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">
                Actions Needed
              </p>
            </div>
            <div className="space-y-2 mb-3 flex-1">
              <p className="text-xs text-foreground">
                <span className="font-semibold text-red-500">3 invoices</span>{' '}
                overdue
              </p>
              <p className="text-xs text-muted-foreground">
                Total: $2,450 • 2 customers affected
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="text-xs h-8 bg-amber-500 hover:bg-amber-600"
              >
                Remind
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8">
                View
              </Button>
            </div>
          </Card>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
