'use client'

import { Card } from '@/components/ui/card'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ServiceDistributionChartProps {
  serviceData: any[]
}

export function ServiceDistributionChart({
  serviceData,
}: ServiceDistributionChartProps) {
  const COLORS = ['#f4a125', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-2">Service Distribution</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Most popular services this month
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Service Distribution Pie Chart */}
        <div className="flex flex-col">
          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-tabular">124</span>
              <span className="text-xs text-muted-foreground">Total Jobs</span>
            </div>
          </div>
        </div>

        {/* Right: Service Legend */}
        <div className="flex flex-col justify-center space-y-2 py-2">
          {serviceData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
  )
}
