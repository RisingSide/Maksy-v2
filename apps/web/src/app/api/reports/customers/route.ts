import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customers } from '@/db/schema'
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
 * GET /api/reports/customers
 * Returns customer growth data aggregated by period
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
    let data: { date: string; newCustomers: number; totalCustomers: number }[] =
      []

    // Get total customers before the range period
    let runningTotal = 0

    if (period === 'monthly') {
      const rangeStart = startOfMonth(subMonths(now, range))

      // Get count of customers before range start
      const priorCountResult = await db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(customers)
        .where(
          and(
            eq(customers.companyId, context.companyId),
            lte(customers.createdAt, rangeStart)
          )
        )
      runningTotal = priorCountResult[0]?.count || 0

      for (let i = range - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))

        const result = await db
          .select({
            count: sql<number>`COUNT(*)::int`,
          })
          .from(customers)
          .where(
            and(
              eq(customers.companyId, context.companyId),
              gte(customers.createdAt, monthStart),
              lte(customers.createdAt, monthEnd)
            )
          )

        const newCustomers = result[0]?.count || 0
        runningTotal += newCustomers

        data.push({
          date: format(monthStart, 'MMM yyyy'),
          newCustomers,
          totalCustomers: runningTotal,
        })
      }
    } else if (period === 'weekly') {
      const rangeStart = startOfWeek(subWeeks(now, range), { weekStartsOn: 1 })

      const priorCountResult = await db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(customers)
        .where(
          and(
            eq(customers.companyId, context.companyId),
            lte(customers.createdAt, rangeStart)
          )
        )
      runningTotal = priorCountResult[0]?.count || 0

      for (let i = range - 1; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })

        const result = await db
          .select({
            count: sql<number>`COUNT(*)::int`,
          })
          .from(customers)
          .where(
            and(
              eq(customers.companyId, context.companyId),
              gte(customers.createdAt, weekStart),
              lte(customers.createdAt, weekEnd)
            )
          )

        const newCustomers = result[0]?.count || 0
        runningTotal += newCustomers

        data.push({
          date: format(weekStart, 'MMM d'),
          newCustomers,
          totalCustomers: runningTotal,
        })
      }
    } else if (period === 'daily') {
      const rangeStart = startOfDay(subDays(now, range))

      const priorCountResult = await db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(customers)
        .where(
          and(
            eq(customers.companyId, context.companyId),
            lte(customers.createdAt, rangeStart)
          )
        )
      runningTotal = priorCountResult[0]?.count || 0

      for (let i = range - 1; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i))
        const dayEnd = endOfDay(subDays(now, i))

        const result = await db
          .select({
            count: sql<number>`COUNT(*)::int`,
          })
          .from(customers)
          .where(
            and(
              eq(customers.companyId, context.companyId),
              gte(customers.createdAt, dayStart),
              lte(customers.createdAt, dayEnd)
            )
          )

        const newCustomers = result[0]?.count || 0
        runningTotal += newCustomers

        data.push({
          date: format(dayStart, 'MMM d'),
          newCustomers,
          totalCustomers: runningTotal,
        })
      }
    }

    // Get top customers by lifetime value
    const topCustomers = await db
      .select({
        id: customers.id,
        name: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
        lifetimeValue: customers.lifetimeValue,
        totalJobs: customers.totalJobs,
      })
      .from(customers)
      .where(eq(customers.companyId, context.companyId))
      .orderBy(desc(customers.lifetimeValue))
      .limit(5)

    // Calculate totals
    const totalNewCustomers = data.reduce((sum, d) => sum + d.newCustomers, 0)
    const currentTotal = data[data.length - 1]?.totalCustomers || 0

    // Growth rate (compare last period to previous)
    const lastPeriod = data[data.length - 1]?.newCustomers || 0
    const previousPeriod = data[data.length - 2]?.newCustomers || 0
    const growthRate =
      previousPeriod > 0
        ? ((lastPeriod - previousPeriod) / previousPeriod) * 100
        : 0

    return NextResponse.json({
      data,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        lifetimeValue: parseFloat(c.lifetimeValue?.toString() || '0'),
        totalJobs: c.totalJobs,
      })),
      summary: {
        totalNewCustomers,
        currentTotal,
        growthRate: Math.round(growthRate * 10) / 10,
        avgNewPerPeriod: Math.round((totalNewCustomers / range) * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Error fetching customer data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    )
  }
}
