import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customers, jobs, invoices, estimates, tasks } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

/**
 * GET /api/dashboard/activity
 * Get recent activity feed for the dashboard
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Get recent customers
    const recentCustomers = await db
      .select({
        id: customers.id,
        type: sql<string>`'customer'`,
        title: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
        description: sql<string>`'New customer added'`,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.companyId, context.companyId))
      .orderBy(desc(customers.createdAt))
      .limit(5)

    // Get recent jobs
    const recentJobs = await db
      .select({
        id: jobs.id,
        type: sql<string>`'job'`,
        title: jobs.jobNumber,
        description: sql<string>`CONCAT('Job ', ${jobs.status})`,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(eq(jobs.companyId, context.companyId))
      .orderBy(desc(jobs.createdAt))
      .limit(5)

    // Get recent invoices
    const recentInvoices = await db
      .select({
        id: invoices.id,
        type: sql<string>`'invoice'`,
        title: invoices.invoiceNumber,
        description: sql<string>`CONCAT('Invoice ', ${invoices.status}, ' - $', ${invoices.total})`,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.companyId, context.companyId))
      .orderBy(desc(invoices.createdAt))
      .limit(5)

    // Get recent estimates
    const recentEstimates = await db
      .select({
        id: estimates.id,
        type: sql<string>`'estimate'`,
        title: estimates.estimateNumber,
        description: sql<string>`CONCAT('Estimate ', ${estimates.status}, ' - $', ${estimates.total})`,
        createdAt: estimates.createdAt,
      })
      .from(estimates)
      .where(eq(estimates.companyId, context.companyId))
      .orderBy(desc(estimates.createdAt))
      .limit(5)

    // Get recent completed tasks
    const recentTasks = await db
      .select({
        id: tasks.id,
        type: sql<string>`'task'`,
        title: tasks.title,
        description: sql<string>`CONCAT('Task ', ${tasks.status})`,
        createdAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.companyId, context.companyId))
      .orderBy(desc(tasks.updatedAt))
      .limit(5)

    // Combine and sort all activities
    const allActivities = [
      ...recentCustomers.map((c) => ({
        ...c,
        entityType: 'customer' as const,
      })),
      ...recentJobs.map((j) => ({ ...j, entityType: 'job' as const })),
      ...recentInvoices.map((i) => ({ ...i, entityType: 'invoice' as const })),
      ...recentEstimates.map((e) => ({
        ...e,
        entityType: 'estimate' as const,
      })),
      ...recentTasks.map((t) => ({ ...t, entityType: 'task' as const })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit)

    return NextResponse.json({
      activities: allActivities,
      total: allActivities.length,
    })
  } catch (error: any) {
    console.error('Error fetching activity feed:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}
