'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  PieChart,
  Wallet,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Eye,
} from 'lucide-react'
import {
  useFinancialInsights,
  FinancialInsight,
} from '@/hooks/use-financial-insights'
import { ScaleOnlyFeature } from '@/components/shared/ScaleOnlyFeature'
import Link from 'next/link'

type PlanType = 'pro' | 'scale' | 'team'

interface FinancialInsightsSectionProps {
  planType: PlanType
}

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

const priorityColors: Record<FinancialInsight['priority'], string> = {
  low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  medium:
    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
}

const priorityLabels: Record<FinancialInsight['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

function InsightCard({
  insight,
  onMarkRead,
}: {
  insight: FinancialInsight
  onMarkRead: (id: string) => void
}) {
  const Icon = insightIcons[insight.insightType] || Sparkles

  return (
    <Card
      className={`glass-card p-4 border-l-4 ${priorityColors[insight.priority]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${priorityColors[insight.priority]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{insight.title}</h4>
            {!insight.isRead && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {insight.content}
          </p>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-[10px] ${priorityColors[insight.priority]}`}
            >
              {priorityLabels[insight.priority]}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onMarkRead(insight.id)}
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function calculateHealthScore(insights: FinancialInsight[]): {
  score: number
  label: string
  color: string
} {
  if (insights.length === 0) {
    return { score: 0, label: 'No Data', color: 'text-muted-foreground' }
  }

  // Calculate score based on insight priorities
  const priorityScores: Record<string, number> = {
    low: 100,
    medium: 75,
    high: 50,
    critical: 25,
  }

  const avgScore =
    insights.reduce((sum, i) => sum + (priorityScores[i.priority] || 50), 0) /
    insights.length

  if (avgScore >= 85)
    return {
      score: Math.round(avgScore),
      label: 'Excellent',
      color: 'text-green-500',
    }
  if (avgScore >= 70)
    return {
      score: Math.round(avgScore),
      label: 'Good',
      color: 'text-blue-500',
    }
  if (avgScore >= 50)
    return {
      score: Math.round(avgScore),
      label: 'Fair',
      color: 'text-yellow-500',
    }
  return {
    score: Math.round(avgScore),
    label: 'Needs Attention',
    color: 'text-red-500',
  }
}

function HealthScoreRing({
  score,
  label,
  color,
}: {
  score: number
  label: string
  color: string
}) {
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl border mb-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-border"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${color}`}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Financial Health</p>
        <p className={`text-lg font-semibold ${color}`}>{label}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Based on {score > 0 ? 'AI analysis' : 'no data'}
        </p>
      </div>
    </div>
  )
}

function InsightsContent() {
  const { insights, isLoading, generateInsights, markAsRead } =
    useFinancialInsights({
      limit: 5,
      unreadOnly: false,
    })

  const healthScore = calculateHealthScore(insights)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground mb-4">
          No financial insights yet
        </p>
        <Button onClick={generateInsights} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Insights
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Financial Health Score */}
      <HealthScoreRing
        score={healthScore.score}
        label={healthScore.label}
        color={healthScore.color}
      />

      {insights.slice(0, 3).map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onMarkRead={markAsRead}
        />
      ))}
      <Link href="/insights">
        <Button variant="outline" className="w-full gap-2" size="sm">
          View All Insights
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}

export function FinancialInsightsSection({
  planType,
}: FinancialInsightsSectionProps) {
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">AI Financial Insights</h3>
            <p className="text-xs text-muted-foreground">Powered by Maksy AI</p>
          </div>
        </div>
        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
          Scale
        </Badge>
      </div>

      <ScaleOnlyFeature
        currentPlan={planType}
        featureName="AI Financial Insights"
        description="Get AI-powered profit margin analysis, pricing suggestions, revenue forecasts, and cash flow predictions."
      >
        <InsightsContent />
      </ScaleOnlyFeature>
    </Card>
  )
}
