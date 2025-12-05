'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface RevenueChartProps {
  revenueData: any[]
}

export function RevenueChart({ revenueData }: RevenueChartProps) {
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Revenue</h3>
        <Tabs defaultValue="6month" className="w-auto">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="6month">6 Months</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
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
                  className="opacity-10"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  className="text-xs text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-xs text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value: number) =>
                    `$${(value / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--card-foreground))',
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    'Revenue',
                  ]}
                  cursor={{
                    stroke: '#f4a125',
                    strokeWidth: 1,
                    strokeOpacity: 0.3,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#colorGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#f4a125', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f4a125" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="forecast">
            <div className="py-12 text-center text-muted-foreground">
              Forecasting coming in Phase 2
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
