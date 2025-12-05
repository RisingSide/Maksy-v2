import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, invoices } from '@/db/schema'
import { eq, sql, and, gte } from 'drizzle-orm'

/**
 * GET /api/dashboard/metrics
 * Get performance metrics for the dashboard (avg duration, completion rate, revenue/job, etc.)
 */
export async function GET() {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get first day of current month
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0]

    // Get job metrics for this month
    const [jobMetrics] = await db
      .select({
        totalJobs: sql<number>`count(*)::int`,
        completedJobs: sql<number>`count(*) filter (where ${jobs.status} = 'completed')::int`,
        avgDurationMinutes: sql<number>`coalesce(avg(${jobs.durationMinutes}), 0)::numeric`,
        totalRevenue: sql<number>`coalesce(sum(${jobs.totalPrice}::numeric), 0)::numeric`,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.companyId, context.companyId),
          gte(jobs.scheduledDate, firstOfMonthStr)
        )
      )

    // Get daily average revenue (based on completed jobs this month)
    const daysInMonth = now.getDate() // Days elapsed this month
    const dailyRevenue =
      daysInMonth > 0 ? Number(jobMetrics.totalRevenue) / daysInMonth : 0

    // Calculate metrics
    const completionRate =
      jobMetrics.totalJobs > 0
        ? Math.round((jobMetrics.completedJobs / jobMetrics.totalJobs) * 100)
        : 0

    const avgDurationHours = Number(jobMetrics.avgDurationMinutes) / 60
    const revenuePerJob =
      jobMetrics.totalJobs > 0
        ? Math.round(Number(jobMetrics.totalRevenue) / jobMetrics.totalJobs)
        : 0

    // Get invoice collection metrics
    const [invoiceMetrics] = await db
      .select({
        totalInvoiced: sql<number>`coalesce(sum(${invoices.total}::numeric), 0)::numeric`,
        totalPaid: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)::numeric`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, context.companyId),
          gte(invoices.issueDate, firstOfMonthStr)
        )
      )

    const collectionRate =
      Number(invoiceMetrics.totalInvoiced) > 0
        ? Math.round(
            (Number(invoiceMetrics.totalPaid) /
              Number(invoiceMetrics.totalInvoiced)) *
              100
          )
        : 0

    // Estimate daily profit (revenue - estimated 40% costs)
    const estimatedDailyProfit = Math.round(dailyRevenue * 0.6)

    return NextResponse.json({
      avgDuration: {
        hours: Math.round(avgDurationHours * 10) / 10, // One decimal place
        minutes: Math.round(Number(jobMetrics.avgDurationMinutes)),
        formatted:
          avgDurationHours >= 1
            ? `${Math.round(avgDurationHours * 10) / 10} hrs`
            : `${Math.round(Number(jobMetrics.avgDurationMinutes))} min`,
      },
      completionRate,
      revenuePerJob,
      dailyRevenue: Math.round(dailyRevenue),
      dailyProfit: estimatedDailyProfit,
      collectionRate,
      totalJobs: jobMetrics.totalJobs,
      completedJobs: jobMetrics.completedJobs,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}
