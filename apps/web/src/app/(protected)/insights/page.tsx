'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  PieChart,
  Wallet,
  Sparkles,
  RefreshCw,
  Eye,
  Filter,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import {
  useFinancialInsights,
  FinancialInsight,
} from '@/hooks/use-financial-insights'
import { usePlanType } from '@/hooks/use-subscription'
import { ScaleOnlyFeature } from '@/components/shared/ScaleOnlyFeature'

const insightIcons: Record<
  FinancialInsight['insightType'],
  typeof AlertTriangle
> = {
  margin_alert: AlertTriangle,
  pricing_suggestion: DollarSign,
  forecast: TrendingUp,
  cost_analysis: PieChart,
  cash_flow: Wallet,
}

const insightLabels: Record<FinancialInsight['insightType'], string> = {
  margin_alert: 'Margin Alert',
  pricing_suggestion: 'Pricing',
  forecast: 'Forecast',
  cost_analysis: 'Cost Analysis',
  cash_flow: 'Cash Flow',
}

const priorityColors: Record<FinancialInsight['priority'], string> = {
  low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  medium:
    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
}

const priorityLabels: Record<FinancialInsight['priority'], string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
  critical: 'Critical',
}

function InsightDetailCard({
  insight,
  onMarkRead,
}: {
  insight: FinancialInsight
  onMarkRead: (id: string) => void
}) {
  const Icon = insightIcons[insight.insightType] || Sparkles
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className={`glass-card overflow-hidden transition-all ${!insight.isRead ? 'ring-2 ring-primary/20' : ''}`}
    >
      <div className={`h-1 ${priorityColors[insight.priority]}`} />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${priorityColors[insight.priority]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{insight.title}</h3>
              {!insight.isRead && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge className={priorityColors[insight.priority]}>
                {priorityLabels[insight.priority]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {insightLabels[insight.insightType]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(insight.generatedAt).toLocaleDateString()}
              </span>
            </div>

            <p
              className={`text-sm text-muted-foreground ${expanded ? '' : 'line-clamp-3'}`}
            >
              {insight.content}
            </p>

            {insight.content.length > 200 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto mt-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Read more'}
              </Button>
            )}

            {/* Data Summary */}
            {insight.data && Object.keys(insight.data).length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-2 text-muted-foreground">
                  Key Metrics
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(insight.data)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="font-semibold text-sm">
                          {typeof value === 'number'
                            ? value.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            : String(value)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {!insight.isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onMarkRead(insight.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function InsightsContent() {
  const [filter, setFilter] = useState<'all' | FinancialInsight['insightType']>(
    'all'
  )
  const { insights, isLoading, generateInsights, markAsRead } =
    useFinancialInsights({
      limit: 50,
      unreadOnly: false,
    })

  const filteredInsights =
    filter === 'all'
      ? insights
      : insights.filter((i) => i.insightType === filter)

  const unreadCount = insights.filter((i) => !i.isRead).length

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Insights</p>
              <p className="text-2xl font-bold">{insights.length}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold">
                {insights.filter((i) => i.priority === 'critical').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <Button onClick={generateInsights} className="w-full h-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate New Insights
          </Button>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="margin_alert">Margins</TabsTrigger>
          <TabsTrigger value="pricing_suggestion">Pricing</TabsTrigger>
          <TabsTrigger value="forecast">Forecasts</TabsTrigger>
          <TabsTrigger value="cost_analysis">Costs</TabsTrigger>
          <TabsTrigger value="cash_flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredInsights.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Insights Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === 'all'
                  ? 'Generate your first insights to get AI-powered financial analysis'
                  : `No ${insightLabels[filter as FinancialInsight['insightType']]} insights available`}
              </p>
              <Button onClick={generateInsights} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Generate Insights
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => (
                <InsightDetailCard
                  key={insight.id}
                  insight={insight}
                  onMarkRead={markAsRead}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function InsightsPage() {
  const planType = usePlanType() || 'pro'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">
              Financial Insights
            </h1>
            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          <p className="text-muted-foreground">
            AI-generated analysis of your business finances
          </p>
        </div>
      </div>

      <ScaleOnlyFeature
        currentPlan={planType}
        featureName="Financial Insights"
        description="Get AI-powered profit margin analysis, pricing suggestions, revenue forecasts, and cash flow predictions."
      >
        <InsightsContent />
      </ScaleOnlyFeature>
    </div>
  )
}
