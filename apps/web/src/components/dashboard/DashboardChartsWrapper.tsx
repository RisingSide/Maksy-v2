'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Sparkles } from 'lucide-react'

interface ChartsWrapperProps {
  revenueData: any[]
  serviceData: any[]
}

export function DashboardChartsWrapper({
  revenueData,
  serviceData,
}: ChartsWrapperProps) {
  return (
    <>
      {/* Revenue Chart */}
      <Card className="glass-card p-6 lg:col-span-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="heading-md">Revenue Overview</h3>
            <p className="text-sm text-muted-foreground">
              Track your earnings over time
            </p>
          </div>
        </div>

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
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
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
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
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
                  opacity={0.1}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
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

          <TabsContent value="forecast">
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">
                AI-Powered Revenue Forecasting
              </p>
              <Badge variant="secondary" className="text-xs">
                Coming Soon - Phase 3
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Service Distribution */}
      <Card className="glass-card p-6 lg:col-span-3">
        <div className="mb-4">
          <h3 className="heading-md">Top Services</h3>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold font-tabular">124</span>
                <span className="text-xs text-muted-foreground">
                  Total Jobs
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-2 py-2">
            {serviceData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground font-tabular">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  )
}
