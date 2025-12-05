import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, services } from '@/db/schema'
import { eq, and, gte, lte, sql, count } from 'drizzle-orm'
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
 * GET /api/reports/jobs
 * Returns job metrics aggregated by period
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
    let data: {
      date: string
      scheduled: number
      completed: number
      cancelled: number
    }[] = []

    // Helper to get job counts by status for a date range
    async function getJobCounts(startDate: Date, endDate: Date) {
      const scheduledDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')

      const result = await db
        .select({
          status: jobs.status,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.companyId, context!.companyId),
            gte(jobs.scheduledDate, scheduledDateStr),
            lte(jobs.scheduledDate, endDateStr)
          )
        )
        .groupBy(jobs.status)

      const counts = {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
      }

      for (const row of result) {
        if (row.status === 'completed') {
          counts.completed = row.count
        } else if (row.status === 'cancelled') {
          counts.cancelled = row.count
        } else {
          counts.scheduled += row.count
        }
      }

      return counts
    }

    if (period === 'monthly') {
      for (let i = range - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))
        const counts = await getJobCounts(monthStart, monthEnd)

        data.push({
          date: format(monthStart, 'MMM yyyy'),
          ...counts,
        })
      }
    } else if (period === 'weekly') {
      for (let i = range - 1; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const counts = await getJobCounts(weekStart, weekEnd)

        data.push({
          date: format(weekStart, 'MMM d'),
          ...counts,
        })
      }
    } else if (period === 'daily') {
      for (let i = range - 1; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i))
        const dayEnd = endOfDay(subDays(now, i))
        const counts = await getJobCounts(dayStart, dayEnd)

        data.push({
          date: format(dayStart, 'MMM d'),
          ...counts,
        })
      }
    }

    // Get job breakdown by service
    const serviceBreakdown = await db
      .select({
        serviceName: services.name,
        serviceColor: services.color,
        count: sql<number>`COUNT(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${jobs.totalPrice}), 0)`,
      })
      .from(jobs)
      .innerJoin(services, eq(jobs.serviceId, services.id))
      .where(eq(jobs.companyId, context.companyId))
      .groupBy(services.id, services.name, services.color)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10)

    // Calculate totals
    const totalScheduled = data.reduce((sum, d) => sum + d.scheduled, 0)
    const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0)
    const totalCancelled = data.reduce((sum, d) => sum + d.cancelled, 0)
    const completionRate =
      totalScheduled + totalCompleted > 0
        ? (totalCompleted / (totalScheduled + totalCompleted)) * 100
        : 0

    return NextResponse.json({
      data,
      serviceBreakdown: serviceBreakdown.map((s) => ({
        name: s.serviceName,
        color: s.serviceColor,
        count: s.count,
        revenue: parseFloat(s.revenue),
      })),
      summary: {
        totalScheduled,
        totalCompleted,
        totalCancelled,
        completionRate: Math.round(completionRate * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Error fetching job data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job data' },
      { status: 500 }
    )
  }
}
