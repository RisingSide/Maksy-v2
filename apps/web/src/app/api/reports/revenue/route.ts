import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { payments, invoices } from '@/db/schema'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfDay,
  endOfDay,
  subDays,
} from 'date-fns'

/**
 * GET /api/reports/revenue
 * Returns revenue data aggregated by period (daily, weekly, monthly)
 *
 * Query params:
 * - period: 'daily' | 'weekly' | 'monthly' (default: 'monthly')
 * - range: number of periods to return (default: 12)
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    const range = parseInt(searchParams.get('range') || '12', 10)

    const now = new Date()
    let data: { date: string; revenue: number; count: number }[] = []

    if (period === 'monthly') {
      // Get monthly revenue for the last N months
      for (let i = range - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))

        const result = await db
          .select({
            totalRevenue: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
            paymentCount: sql<number>`COUNT(*)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.companyId, context.companyId),
              gte(payments.createdAt, monthStart),
              lte(payments.createdAt, monthEnd)
            )
          )

        data.push({
          date: format(monthStart, 'MMM yyyy'),
          revenue: parseFloat(result[0]?.totalRevenue || '0'),
          count: Number(result[0]?.paymentCount || 0),
        })
      }
    } else if (period === 'weekly') {
      // Get weekly revenue for the last N weeks
      for (let i = range - 1; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })

        const result = await db
          .select({
            totalRevenue: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
            paymentCount: sql<number>`COUNT(*)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.companyId, context.companyId),
              gte(payments.createdAt, weekStart),
              lte(payments.createdAt, weekEnd)
            )
          )

        data.push({
          date: format(weekStart, 'MMM d'),
          revenue: parseFloat(result[0]?.totalRevenue || '0'),
          count: Number(result[0]?.paymentCount || 0),
        })
      }
    } else if (period === 'daily') {
      // Get daily revenue for the last N days
      for (let i = range - 1; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i))
        const dayEnd = endOfDay(subDays(now, i))

        const result = await db
          .select({
            totalRevenue: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
            paymentCount: sql<number>`COUNT(*)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.companyId, context.companyId),
              gte(payments.createdAt, dayStart),
              lte(payments.createdAt, dayEnd)
            )
          )

        data.push({
          date: format(dayStart, 'MMM d'),
          revenue: parseFloat(result[0]?.totalRevenue || '0'),
          count: Number(result[0]?.paymentCount || 0),
        })
      }
    }

    // Calculate totals and averages
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
    const avgRevenue = totalRevenue / data.length || 0
    const totalPayments = data.reduce((sum, d) => sum + d.count, 0)

    // Calculate trend (compare last period to previous)
    const lastPeriod = data[data.length - 1]?.revenue || 0
    const previousPeriod = data[data.length - 2]?.revenue || 0
    const trend =
      previousPeriod > 0
        ? ((lastPeriod - previousPeriod) / previousPeriod) * 100
        : 0

    return NextResponse.json({
      data,
      summary: {
        totalRevenue,
        avgRevenue,
        totalPayments,
        trend: Math.round(trend * 10) / 10, // Round to 1 decimal
      },
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}
