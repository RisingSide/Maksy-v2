/**
 * Revenue Forecast API
 *
 * GET /api/financial/forecast - Get revenue forecast data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { FinancialAIService } from '@/lib/services/financial-ai'
import { getFeatureAccess } from '@/lib/feature-gates'

export async function GET(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context

    // Check if user has access to financial AI (Scale tier only)
    if (!getFeatureAccess(planType, 'financialDashboard')) {
      return NextResponse.json(
        { error: 'Financial AI Dashboard is only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Generate forecast
    const service = new FinancialAIService(companyId)
    const forecast = await service.forecastRevenue()

    // Transform data for frontend chart
    const monthlyRevenue = forecast.data.monthly_revenue || {}
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    // Build monthly_data array for chart
    const monthly_data: { month: string; actual: number; forecast?: number }[] =
      []
    const sortedMonths = Object.keys(monthlyRevenue).sort()

    sortedMonths.forEach((monthKey) => {
      const [year, monthNum] = monthKey.split('-')
      const monthName = monthNames[parseInt(monthNum) - 1]
      monthly_data.push({
        month: `${monthName} ${year.slice(2)}`,
        actual: monthlyRevenue[monthKey],
      })
    })

    // Add forecast months
    const now = new Date()
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now)
      futureDate.setMonth(futureDate.getMonth() + i)
      const monthName = monthNames[futureDate.getMonth()]
      const year = futureDate.getFullYear().toString().slice(2)
      monthly_data.push({
        month: `${monthName} ${year}`,
        actual: 0,
        forecast:
          forecast.data.recent_avg *
          (1 + (forecast.data.growth_pct / 100 / 3) * i),
      })
    }

    return NextResponse.json({
      projected_quarterly: forecast.data.projected_quarterly,
      growth_pct: Math.round(forecast.data.growth_pct),
      confidence:
        forecast.data.growth_pct > 5
          ? 'High'
          : forecast.data.growth_pct > -5
            ? 'Medium'
            : 'Low',
      monthly_data,
      commentary: forecast.content,
    })
  } catch (error) {
    console.error('Error generating revenue forecast:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
