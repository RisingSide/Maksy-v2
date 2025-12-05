import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customers, jobs, invoices, estimates, tasks } from '@/db/schema'
import { eq, and, count, sum, gte, lte, sql } from 'drizzle-orm'

/**
 * GET /api/dashboard/stats
 * Get key business statistics for the dashboard
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    // Date range for stats (default: current month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const startDate = searchParams.get('startDate') || startOfMonth
    const endDate = searchParams.get('endDate') || endOfMonth

    // Get total customers
    const [customerCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.companyId, context.companyId))

    // Get jobs stats for the period
    const [jobStats] = await db
      .select({
        total: count(),
        completed: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'completed' THEN 1 END)`,
        scheduled: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'scheduled' THEN 1 END)`,
        inProgress: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'in_progress' THEN 1 END)`,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.companyId, context.companyId),
          gte(jobs.scheduledDate, startDate),
          lte(jobs.scheduledDate, endDate)
        )
      )

    // Get invoice stats for the period
    const [invoiceStats] = await db
      .select({
        total: count(),
        totalAmount: sum(invoices.total),
        paidAmount: sum(invoices.amountPaid),
        unpaid: sql<number>`COUNT(CASE WHEN ${invoices.status} IN ('unpaid', 'overdue') THEN 1 END)`,
        paid: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'paid' THEN 1 END)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, context.companyId),
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate)
        )
      )

    // Get estimate stats for the period
    const [estimateStats] = await db
      .select({
        total: count(),
        totalAmount: sum(estimates.total),
        pending: sql<number>`COUNT(CASE WHEN ${estimates.status} IN ('draft', 'sent') THEN 1 END)`,
        approved: sql<number>`COUNT(CASE WHEN ${estimates.status} = 'approved' THEN 1 END)`,
        declined: sql<number>`COUNT(CASE WHEN ${estimates.status} = 'declined' THEN 1 END)`,
      })
      .from(estimates)
      .where(
        and(
          eq(estimates.companyId, context.companyId),
          gte(estimates.createdAt, new Date(startDate)),
          lte(estimates.createdAt, new Date(endDate))
        )
      )

    // Get task stats
    const [taskStats] = await db
      .select({
        total: count(),
        incomplete: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'incomplete' THEN 1 END)`,
        complete: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'complete' THEN 1 END)`,
        overdue: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'incomplete' AND ${tasks.dueDate} < CURRENT_DATE THEN 1 END)`,
      })
      .from(tasks)
      .where(eq(tasks.companyId, context.companyId))

    // Calculate conversion rate (approved estimates / total estimates)
    const conversionRate =
      estimateStats.total > 0
        ? Math.round(
            (Number(estimateStats.approved) / estimateStats.total) * 100
          )
        : 0

    // Calculate collection rate (paid / total invoiced)
    const totalInvoiced = parseFloat(invoiceStats.totalAmount || '0')
    const totalPaid = parseFloat(invoiceStats.paidAmount || '0')
    const collectionRate =
      totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0

    return NextResponse.json({
      period: { startDate, endDate },
      customers: {
        total: customerCount.count,
      },
      jobs: {
        total: jobStats.total,
        completed: Number(jobStats.completed),
        scheduled: Number(jobStats.scheduled),
        inProgress: Number(jobStats.inProgress),
        completionRate:
          jobStats.total > 0
            ? Math.round((Number(jobStats.completed) / jobStats.total) * 100)
            : 0,
      },
      invoices: {
        total: invoiceStats.total,
        totalAmount: totalInvoiced,
        paidAmount: totalPaid,
        unpaidCount: Number(invoiceStats.unpaid),
        paidCount: Number(invoiceStats.paid),
        collectionRate,
      },
      estimates: {
        total: estimateStats.total,
        totalAmount: parseFloat(estimateStats.totalAmount || '0'),
        pendingCount: Number(estimateStats.pending),
        approvedCount: Number(estimateStats.approved),
        declinedCount: Number(estimateStats.declined),
        conversionRate,
      },
      tasks: {
        total: taskStats.total,
        incomplete: Number(taskStats.incomplete),
        complete: Number(taskStats.complete),
        overdue: Number(taskStats.overdue),
      },
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
