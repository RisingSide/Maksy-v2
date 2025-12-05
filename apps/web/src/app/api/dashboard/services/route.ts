import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, services } from '@/db/schema'
import { eq, sql, and, gte } from 'drizzle-orm'

/**
 * GET /api/dashboard/services
 * Get service distribution and revenue breakdown for the dashboard
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

    // Get service distribution (jobs by service this month)
    const serviceDistribution = await db
      .select({
        serviceId: jobs.serviceId,
        serviceName: services.name,
        serviceColor: services.color,
        jobCount: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${jobs.totalPrice}::numeric), 0)::numeric`,
      })
      .from(jobs)
      .innerJoin(services, eq(jobs.serviceId, services.id))
      .where(
        and(
          eq(jobs.companyId, context.companyId),
          gte(jobs.scheduledDate, firstOfMonthStr)
        )
      )
      .groupBy(jobs.serviceId, services.name, services.color)
      .orderBy(sql`count(*) desc`)
      .limit(5)

    // Calculate totals
    const totalJobs = serviceDistribution.reduce(
      (sum, s) => sum + s.jobCount,
      0
    )
    const totalRevenue = serviceDistribution.reduce(
      (sum, s) => sum + Number(s.totalRevenue),
      0
    )
    const avgRevenuePerJob = totalJobs > 0 ? totalRevenue / totalJobs : 0

    // Calculate percentages and format for charts
    const distribution = serviceDistribution.map((s, index) => {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
      return {
        name: s.serviceName,
        value: totalJobs > 0 ? Math.round((s.jobCount / totalJobs) * 100) : 0,
        jobCount: s.jobCount,
        revenue: Number(s.totalRevenue),
        avgRevenue:
          s.jobCount > 0 ? Math.round(Number(s.totalRevenue) / s.jobCount) : 0,
        color: s.serviceColor || colors[index % colors.length],
      }
    })

    return NextResponse.json({
      distribution,
      summary: {
        totalJobs,
        totalRevenue,
        avgRevenuePerJob: Math.round(avgRevenuePerJob),
        serviceCount: serviceDistribution.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching service distribution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service distribution' },
      { status: 500 }
    )
  }
}
