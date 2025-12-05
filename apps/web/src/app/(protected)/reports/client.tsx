'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface RevenueData {
  data: { date: string; revenue: number; count: number }[]
  summary: {
    totalRevenue: number
    avgRevenue: number
    totalPayments: number
    trend: number
  }
}

interface JobsData {
  data: {
    date: string
    scheduled: number
    completed: number
    cancelled: number
  }[]
  serviceBreakdown: {
    name: string
    color: string
    count: number
    revenue: number
  }[]
  summary: {
    totalScheduled: number
    totalCompleted: number
    totalCancelled: number
    completionRate: number
  }
}

interface CustomersData {
  data: { date: string; newCustomers: number; totalCustomers: number }[]
  topCustomers: {
    id: string
    name: string
    lifetimeValue: number
    totalJobs: number
  }[]
  summary: {
    totalNewCustomers: number
    currentTotal: number
    growthRate: number
    avgNewPerPeriod: number
  }
}

type Period = 'daily' | 'weekly' | 'monthly'

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Stat Card Component
function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  trendLabel,
  className,
}: {
  title: string
  value: string | number
  trend?: number
  icon: React.ElementType
  trendLabel?: string
  className?: string
}) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <Card className={cn('glass-card p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-green-500',
                  isNegative && 'text-red-500',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-muted-foreground ml-1">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  )
}

// Main Reports Client Component
export function ReportsClient() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [jobsData, setJobsData] = useState<JobsData | null>(null)
  const [customersData, setCustomersData] = useState<CustomersData | null>(null)

  // Fetch all report data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [revenueRes, jobsRes, customersRes] = await Promise.all([
        fetch(`/api/reports/revenue?period=${period}`),
        fetch(`/api/reports/jobs?period=${period}`),
        fetch(`/api/reports/customers?period=${period}`),
      ])

      if (revenueRes.ok) {
        setRevenueData(await revenueRes.json())
      }
      if (jobsRes.ok) {
        setJobsData(await jobsRes.json())
      }
      if (customersRes.ok) {
        setCustomersData(await customersRes.json())
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Chart colors
  const COLORS = [
    '#f4a125',
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#ec4899',
    '#14b8a6',
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(revenueData?.summary.totalRevenue || 0)}
              trend={revenueData?.summary.trend}
              trendLabel="vs last period"
              icon={DollarSign}
            />
            <StatCard
              title="Jobs Completed"
              value={jobsData?.summary.totalCompleted || 0}
              trend={jobsData?.summary.completionRate}
              trendLabel="completion rate"
              icon={Briefcase}
            />
            <StatCard
              title="Total Customers"
              value={customersData?.summary.currentTotal || 0}
              trend={customersData?.summary.growthRate}
              trendLabel="growth"
              icon={Users}
            />
            <StatCard
              title="Avg per Period"
              value={formatCurrency(revenueData?.summary.avgRevenue || 0)}
              icon={Calendar}
            />
          </div>

          {/* Charts */}
          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="revenue" className="gap-2">
                <LineChartIcon className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue Chart */}
                <Card className="glass-card p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">
                    Revenue Over Time
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData?.data || []}>
                        <defs>
                          <linearGradient
                            id="revenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f4a125"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f4a125"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `$${v / 1000}k`}
                          className="text-muted-foreground"
                        />
                        <Tooltip
                          content={
                            <CustomTooltip
                              formatter={(v: number) => formatCurrency(v)}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#f4a125"
                          strokeWidth={2}
                          fill="url(#revenueGradient)"
                          name="Revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Payment Stats */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Payment Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        Total Payments
                      </span>
                      <span className="font-semibold">
                        {revenueData?.summary.totalPayments || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        Average Payment
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(
                          revenueData?.summary.totalPayments
                            ? revenueData.summary.totalRevenue /
                                revenueData.summary.totalPayments
                            : 0
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        Period Trend
                      </span>
                      <Badge
                        variant={
                          (revenueData?.summary.trend || 0) >= 0
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {(revenueData?.summary.trend || 0) > 0 ? '+' : ''}
                        {revenueData?.summary.trend || 0}%
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Jobs Chart */}
                <Card className="glass-card p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Jobs Overview</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobsData?.data || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="completed"
                          fill="#22c55e"
                          name="Completed"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="scheduled"
                          fill="#3b82f6"
                          name="Scheduled"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="cancelled"
                          fill="#ef4444"
                          name="Cancelled"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Service Breakdown */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">By Service</h3>
                  {jobsData?.serviceBreakdown &&
                  jobsData.serviceBreakdown.length > 0 ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={jobsData.serviceBreakdown}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                            >
                              {jobsData.serviceBreakdown.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={
                                    entry.color || COLORS[index % COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-4">
                        {jobsData.serviceBreakdown
                          .slice(0, 5)
                          .map((service, index) => (
                            <div
                              key={service.name}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      service.color ||
                                      COLORS[index % COLORS.length],
                                  }}
                                />
                                <span className="truncate max-w-[120px]">
                                  {service.name}
                                </span>
                              </div>
                              <span className="font-medium">
                                {service.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      No job data available
                    </div>
                  )}
                </Card>
              </div>

              {/* Job Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {jobsData?.summary.totalScheduled || 0}
                  </p>
                </Card>
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-500">
                    {jobsData?.summary.totalCompleted || 0}
                  </p>
                </Card>
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-red-500">
                    {jobsData?.summary.totalCancelled || 0}
                  </p>
                </Card>
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {jobsData?.summary.completionRate || 0}%
                  </p>
                </Card>
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Customer Growth Chart */}
                <Card className="glass-card p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">
                    Customer Growth
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={customersData?.data || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalCustomers"
                          stroke="#f4a125"
                          strokeWidth={2}
                          dot={false}
                          name="Total Customers"
                        />
                        <Line
                          type="monotone"
                          dataKey="newCustomers"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                          name="New Customers"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Top Customers */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
                  {customersData?.topCustomers &&
                  customersData.topCustomers.length > 0 ? (
                    <div className="space-y-3">
                      {customersData.topCustomers.map((customer, index) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm truncate max-w-[100px]">
                                {customer.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {customer.totalJobs} jobs
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-primary">
                            {formatCurrency(customer.lifetimeValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      No customer data available
                    </div>
                  )}
                </Card>
              </div>

              {/* Customer Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold">
                    {customersData?.summary.currentTotal || 0}
                  </p>
                </Card>
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    New This Period
                  </p>
                  <p className="text-2xl font-bold text-green-500">
                    +{customersData?.summary.totalNewCustomers || 0}
                  </p>
                </Card>
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold text-primary">
                    {customersData?.summary.growthRate || 0}%
                  </p>
                </Card>
                <Card className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Avg New/Period
                  </p>
                  <p className="text-2xl font-bold">
                    {customersData?.summary.avgNewPerPeriod || 0}
                  </p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
