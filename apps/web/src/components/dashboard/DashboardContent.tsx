'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  Users,
  Briefcase,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { DashboardWithOnboarding } from '@/components/dashboard/DashboardWithOnboarding'
import { FinancialInsightsSection } from '@/components/dashboard/FinancialInsightsSection'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import {
  useDashboardStats,
  useRevenueData,
  useServiceDistribution,
  usePerformanceMetrics,
  useUpcomingAppointments,
} from '@/hooks/use-dashboard'
import { useRevenueForecast } from '@/hooks/use-financial-insights'

// Fallback mock data (used when API returns no data)
const fallbackRevenueData = [
  { month: 'May', revenue: 0 },
  { month: 'Jun', revenue: 0 },
  { month: 'Jul', revenue: 0 },
  { month: 'Aug', revenue: 0 },
  { month: 'Sep', revenue: 0 },
  { month: 'Oct', revenue: 0 },
]

// Default colors for services
const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

interface DashboardContentProps {
  showOnboarding: boolean
  companyId: string
  planType: 'pro' | 'scale' | 'team'
}

export function DashboardContent({
  showOnboarding,
  companyId,
  planType,
}: DashboardContentProps) {
  const router = useRouter()

  // Fetch real data from APIs
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { data: revenueApiData, isLoading: revenueLoading } = useRevenueData(6)
  const { data: serviceData, isLoading: servicesLoading } =
    useServiceDistribution()
  const { metrics, isLoading: metricsLoading } = usePerformanceMetrics()
  const { appointments, isLoading: appointmentsLoading } =
    useUpcomingAppointments()
  const { forecast: revenueForecast, isLoading: forecastLoading } =
    useRevenueForecast()

  // Transform revenue data for charts
  const revenueData =
    revenueApiData?.chartData?.map((item) => ({
      month: new Date(item.month + '-01').toLocaleDateString('en-US', {
        month: 'short',
      }),
      revenue: item.revenue,
    })) || fallbackRevenueData

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Get service distribution data or fallback
  const serviceDistribution = serviceData?.distribution || []
  const serviceSummary = serviceData?.summary || {
    totalJobs: 0,
    avgRevenuePerJob: 0,
  }

  // Get top 3 services for bar chart
  const topServices = serviceDistribution.slice(0, 3).map((s, i) => ({
    name: s.name,
    revenue: s.avgRevenue,
    color: s.color || defaultColors[i % defaultColors.length],
  }))

  const dashboardContent = (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting with Inline Tip */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="heading-xl text-foreground mb-2">
            Good Morning, Chase
          </h1>
          <p className="subtitle text-muted-foreground">
            Here&apos;s what&apos;s happening with your business today
          </p>
        </div>

        {/* Maksy AI Tip - Inline */}
        <div className="hidden xl:flex items-center h-10 px-4 gap-3 bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-primary/30 rounded-r-lg backdrop-blur-sm flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            <span className="font-medium text-foreground">Tip:</span> Encourage
            your team this week
          </p>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Next →
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="glass-card p-5">
          {statsLoading ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-8 w-32" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                {revenueApiData?.summary?.monthOverMonthGrowth !==
                  undefined && (
                  <Badge
                    className={`gap-1 stat-badge ${revenueApiData.summary.monthOverMonthGrowth >= 0 ? 'stat-badge-up' : 'stat-badge-down'}`}
                  >
                    {revenueApiData.summary.monthOverMonthGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(revenueApiData.summary.monthOverMonthGrowth)}%
                  </Badge>
                )}
              </div>
              <p className="stat-label text-muted-foreground mb-1">
                Total Revenue
              </p>
              <h3 className="stat-number text-foreground">
                {formatCurrency(revenueApiData?.summary?.totalRevenue || 0)}
              </h3>
              <p className="text-xs text-green-600 mt-1.5">
                {stats?.invoices?.collectionRate || 0}% collection rate
              </p>
            </>
          )}
        </Card>

        {/* Active Jobs */}
        <Card className="glass-card p-5">
          {statsLoading ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-8 w-16" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <Badge className="gap-1 stat-badge stat-badge-up">
                  {stats?.jobs?.completionRate || 0}%
                </Badge>
              </div>
              <p className="stat-label text-muted-foreground mb-1">
                Active Jobs
              </p>
              <h3 className="stat-number text-foreground">
                {(stats?.jobs?.scheduled || 0) + (stats?.jobs?.inProgress || 0)}
              </h3>
              <p className="text-xs text-blue-600 mt-1.5">
                {stats?.jobs?.completed || 0} completed this month
              </p>
            </>
          )}
        </Card>

        {/* Customers */}
        <Card className="glass-card p-5">
          {statsLoading ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-8 w-16" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="gap-1 stat-badge bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                  {stats?.estimates?.conversionRate || 0}%
                </Badge>
              </div>
              <p className="stat-label text-muted-foreground mb-1">
                Total Customers
              </p>
              <h3 className="stat-number text-foreground">
                {stats?.customers?.total || 0}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1.5">
                {stats?.estimates?.conversionRate || 0}% conversion rate
              </p>
            </>
          )}
        </Card>

        {/* Pending Tasks */}
        <Card className="glass-card p-5">
          {statsLoading ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-8 w-16" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                {(stats?.tasks?.overdue || 0) > 0 && (
                  <Badge className="gap-1 stat-badge stat-badge-down">
                    <ArrowDownRight className="h-3 w-3" />
                    {stats?.tasks?.overdue}
                  </Badge>
                )}
              </div>
              <p className="stat-label text-muted-foreground mb-1">
                Pending Tasks
              </p>
              <h3 className="stat-number text-foreground">
                {stats?.tasks?.incomplete || 0}
              </h3>
              <p className="text-xs text-amber-600 mt-1.5">
                {stats?.tasks?.overdue || 0} overdue
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-7 mb-8">
        {/* Revenue Chart - Large */}
        <Card className="glass-card p-6 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-md">Revenue Overview</h3>
              <p className="text-sm text-muted-foreground">
                Track your earnings over time
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-150 hover:scale-[1.02]"
            >
              View Report
            </Button>
          </div>

          {/* Chart View Tabs */}
          <Tabs defaultValue="6month" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="6month">6-Month View</TabsTrigger>
              <TabsTrigger value="forecast" className="gap-1.5">
                Forecast
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  AI
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="week">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData.slice(-1)}>
                  <XAxis
                    dataKey="month"
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--card-foreground))',
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      'Revenue',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f4a125"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="month">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData.slice(-2)}>
                  <XAxis
                    dataKey="month"
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--card-foreground))',
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      'Revenue',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f4a125"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="6month">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="opacity-[0.08] dark:opacity-[0.08]"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--card-foreground))',
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      'Revenue',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f4a125"
                    strokeWidth={3}
                    dot={false}
                    fill="url(#colorRevenue)"
                  />
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f4a125" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f4a125" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="forecast">
              {planType !== 'scale' ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-2">
                    AI-Powered Revenue Forecasting
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Scale Plan Feature
                  </Badge>
                </div>
              ) : forecastLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : revenueForecast ? (
                <div className="space-y-4">
                  {/* Forecast Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg border">
                      <p className="text-xs text-muted-foreground">
                        Projected Q Revenue
                      </p>
                      <p className="text-xl font-bold">
                        {formatCurrency(
                          revenueForecast.projected_quarterly || 0
                        )}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border">
                      <p className="text-xs text-muted-foreground">
                        Growth Rate
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        +{revenueForecast.growth_pct || 0}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-lg border">
                      <p className="text-xs text-muted-foreground">
                        Confidence
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {revenueForecast.confidence || 'Medium'}
                      </p>
                    </div>
                  </div>

                  {/* Forecast Chart */}
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueForecast.monthly_data || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="opacity-[0.08]"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        stroke="currentColor"
                        className="text-xs text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="currentColor"
                        className="text-xs text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [
                          `$${value.toLocaleString()}`,
                          'Forecast',
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#f4a125"
                        strokeWidth={2}
                        dot={{ fill: '#f4a125' }}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#8B5CF6' }}
                        name="Forecast"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* AI Commentary */}
                  {revenueForecast.commentary && (
                    <div className="flex items-start gap-2 p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                      <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {revenueForecast.commentary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No forecast data available yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Complete more jobs to generate predictions
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Service Breakdown - Enhanced with Dual Charts */}
        <Card className="glass-card p-6 lg:col-span-3">
          <div className="mb-4">
            <h3 className="heading-md">Top Services</h3>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>

          {servicesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : serviceDistribution.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No service data yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete some jobs to see distribution
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Service Distribution Pie Chart */}
              <div className="flex flex-col">
                <div className="h-44 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          serviceDistribution as Array<{
                            name: string
                            value: number
                            color?: string
                          }>
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.color ||
                              defaultColors[index % defaultColors.length]
                            }
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold font-tabular">
                      {serviceSummary.totalJobs}
                    </span>
                    <span className="text-xs font-semibold text-foreground/70">
                      Total Jobs
                    </span>
                  </div>
                </div>

                {/* Compact Legend */}
                <div className="space-y-1.5 mt-3">
                  {serviceDistribution.slice(0, 3).map((service, index) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              service.color ||
                              defaultColors[index % defaultColors.length],
                          }}
                        />
                        <span className="text-muted-foreground truncate max-w-[80px]">
                          {service.name}
                        </span>
                      </div>
                      <span className="font-semibold font-tabular">
                        {service.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Average Revenue Bar Chart */}
              <div className="flex flex-col">
                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Revenue per Job
                  </p>
                  <p className="text-2xl font-bold font-tabular text-foreground">
                    {formatCurrency(serviceSummary.avgRevenuePerJob)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Overall average
                  </p>
                </div>

                {/* Bar Chart */}
                {topServices.length > 0 ? (
                  <div className="flex-1 flex items-end justify-between gap-3 mt-2">
                    {topServices.map((service, index) => {
                      const maxRevenue = Math.max(
                        ...topServices.map((s) => s.revenue),
                        1
                      )
                      const heightPercent = (service.revenue / maxRevenue) * 100

                      return (
                        <div
                          key={service.name}
                          className="flex-1 flex flex-col items-center gap-2"
                          style={{
                            animation: `slideUpBar 0.6s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <div className="w-full relative group">
                            <div
                              className="w-full rounded-t-lg transition-all hover:opacity-80"
                              style={{
                                height: `${Math.max(heightPercent * 1.2, 20)}px`,
                                background: `linear-gradient(to top, ${service.color}, ${service.color}dd)`,
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold font-tabular">
                              {formatCurrency(service.revenue)}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                              {service.name}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Performance Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Avg Duration
              </p>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="font-tabular text-lg font-bold">
                  {metrics?.avgDuration?.formatted || '0 min'}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Completion</p>
              {metricsLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <p className="font-tabular text-lg font-bold">
                  {metrics?.completionRate || 0}%
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Jobs This Month
              </p>
              {metricsLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <p className="font-tabular text-lg font-bold">
                  {metrics?.totalJobs || 0}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Revenue/Job
              </p>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="font-tabular text-lg font-bold">
                  {formatCurrency(metrics?.revenuePerJob || 0)}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Daily Revenue
              </p>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="font-tabular text-lg font-bold">
                  {formatCurrency(metrics?.dailyRevenue || 0)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Insights (Scale Feature) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Upcoming Appointments */}
          <Card className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="heading-md">Upcoming Appointments</h3>
                <p className="text-sm text-muted-foreground">Next 7 days</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-150 hover:scale-[1.02]"
              >
                View All
              </Button>
            </div>

            {/* Table */}
            {appointmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule some jobs to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((job) => {
                  const statusColors: Record<string, string> = {
                    scheduled:
                      'bg-blue-500/20 text-blue-300 dark:text-blue-400',
                    confirmed:
                      'bg-green-500/20 text-green-600 dark:text-green-400',
                    in_progress:
                      'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
                  }

                  return (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/jobs?id=${job.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && router.push(`/jobs?id=${job.id}`)
                      }
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                        {job.customerInitials}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{job.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.service}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {job.date}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.tech}
                      </div>
                      <Badge
                        className={
                          statusColors[job.status] || statusColors.scheduled
                        }
                      >
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Financial AI Insights - Scale Feature */}
        <FinancialInsightsSection planType={planType} />
      </div>
    </div>
  )

  // Wrap with onboarding banner if needed
  if (showOnboarding) {
    return (
      <DashboardWithOnboarding
        companyId={companyId}
        planType={planType}
        showBanner={showOnboarding}
      >
        {dashboardContent}
      </DashboardWithOnboarding>
    )
  }

  return dashboardContent
}
