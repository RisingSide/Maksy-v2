'use client'

import { Card } from '@/components/ui/card'
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

interface DashboardChartsProps {
  revenueData: any[]
  pieData: any[]
}

export function DashboardCharts({
  revenueData,
  pieData,
}: DashboardChartsProps) {
  const COLORS = ['#f4a125', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2 mb-6">
      {/* Revenue Chart */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4">Revenue Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.1}
              />
              <XAxis dataKey="month" stroke="currentColor" opacity={0.5} />
              <YAxis stroke="currentColor" opacity={0.5} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f4a125"
                strokeWidth={2}
                dot={{ fill: '#f4a125' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Service Distribution Chart */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4">Service Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
