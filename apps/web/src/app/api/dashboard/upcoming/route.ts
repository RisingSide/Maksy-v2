import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, customers, services, teamMembers } from '@/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'

/**
 * GET /api/dashboard/upcoming
 * Get upcoming jobs for the next 7 days
 */
export async function GET() {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date range (today to 7 days from now)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    // Get upcoming jobs
    const upcomingJobs = await db
      .select({
        job: jobs,
        customer: customers,
        service: services,
        teamMember: teamMembers,
      })
      .from(jobs)
      .innerJoin(customers, eq(jobs.customerId, customers.id))
      .innerJoin(services, eq(jobs.serviceId, services.id))
      .leftJoin(teamMembers, eq(jobs.assignedTeamMemberId, teamMembers.id))
      .where(
        and(
          eq(jobs.companyId, context.companyId),
          gte(jobs.scheduledDate, todayStr),
          lte(jobs.scheduledDate, nextWeekStr)
        )
      )
      .orderBy(asc(jobs.scheduledDate), asc(jobs.scheduledTime))
      .limit(10)

    // Transform results
    const appointments = upcomingJobs.map((row) => {
      // Format date and time
      const dateObj = new Date(
        row.job.scheduledDate + 'T' + row.job.scheduledTime
      )
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })

      return {
        id: row.job.id,
        customer: `${row.customer.firstName} ${row.customer.lastName}`,
        customerInitials: `${row.customer.firstName[0]}${row.customer.lastName[0]}`,
        service: row.service.name,
        date: `${formattedDate}, ${formattedTime}`,
        scheduledDate: row.job.scheduledDate,
        scheduledTime: row.job.scheduledTime,
        tech: row.teamMember
          ? `${row.teamMember.firstName} ${row.teamMember.lastName}`
          : 'Unassigned',
        status: row.job.status,
        totalPrice: row.job.totalPrice,
      }
    })

    return NextResponse.json({
      appointments,
      total: appointments.length,
    })
  } catch (error: any) {
    console.error('Error fetching upcoming appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming appointments' },
      { status: 500 }
    )
  }
}
