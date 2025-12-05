import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  teamMembers,
  jobs,
  jobTracking,
  customers,
  services,
} from '@/db/schema'
import { eq, and, sql, desc, gte, isNull } from 'drizzle-orm'
import { format, startOfDay, endOfDay } from 'date-fns'

/**
 * GET /api/tracking
 * Returns team member locations and current job status
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const dateStr = format(targetDate, 'yyyy-MM-dd')

    // Get all active team members
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        firstName: teamMembers.firstName,
        lastName: teamMembers.lastName,
        email: teamMembers.email,
        phone: teamMembers.phone,
        avatarUrl: teamMembers.avatarUrl,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.companyId, context.companyId),
          eq(teamMembers.status, 'active')
        )
      )

    // Get today's jobs with tracking info for each team member
    const todaysJobs = await db
      .select({
        jobId: jobs.id,
        jobNumber: jobs.jobNumber,
        teamMemberId: jobs.assignedTeamMemberId,
        scheduledTime: jobs.scheduledTime,
        durationMinutes: jobs.durationMinutes,
        status: jobs.status,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerAddress: customers.addressLine1,
        customerCity: customers.city,
        serviceName: services.name,
        // Tracking data
        trackingId: jobTracking.id,
        onMyWayAt: jobTracking.onMyWayAt,
        onMyWayLat: jobTracking.onMyWayLat,
        onMyWayLng: jobTracking.onMyWayLng,
        arrivedAt: jobTracking.arrivedAt,
        arrivedLat: jobTracking.arrivedLat,
        arrivedLng: jobTracking.arrivedLng,
        startedAt: jobTracking.startedAt,
        completedAt: jobTracking.completedAt,
        driveTimeMinutes: jobTracking.driveTimeMinutes,
        jobDurationMinutes: jobTracking.jobDurationMinutes,
        milesDriven: jobTracking.milesDriven,
      })
      .from(jobs)
      .leftJoin(jobTracking, eq(jobs.id, jobTracking.jobId))
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(services, eq(jobs.serviceId, services.id))
      .where(
        and(
          eq(jobs.companyId, context.companyId),
          eq(jobs.scheduledDate, dateStr)
        )
      )
      .orderBy(jobs.scheduledTime)

    // Build team member status with their current/next job
    const teamStatus = members.map((member) => {
      // Find jobs assigned to this team member
      const memberJobs = todaysJobs.filter((j) => j.teamMemberId === member.id)

      // Determine current status based on job tracking
      let status: 'available' | 'on-the-way' | 'at-job' | 'working' =
        'available'
      let currentJob = null
      let currentLocation = null
      let eta = null

      // Find active job (on my way, arrived, or in progress)
      const activeJob = memberJobs.find((j) => {
        if (j.onMyWayAt && !j.arrivedAt) return true // On the way
        if (j.arrivedAt && !j.completedAt) return true // At job or working
        return false
      })

      if (activeJob) {
        currentJob = {
          id: activeJob.jobId,
          jobNumber: activeJob.jobNumber,
          customerName:
            `${activeJob.customerFirstName || ''} ${activeJob.customerLastName || ''}`.trim(),
          serviceName: activeJob.serviceName,
          address: activeJob.customerAddress,
          city: activeJob.customerCity,
          scheduledTime: activeJob.scheduledTime,
        }

        if (activeJob.onMyWayAt && !activeJob.arrivedAt) {
          status = 'on-the-way'
          currentLocation = {
            lat: parseFloat(activeJob.onMyWayLat?.toString() || '0'),
            lng: parseFloat(activeJob.onMyWayLng?.toString() || '0'),
          }
          // Calculate ETA (simple estimate - in production would use Google Directions API)
          eta = '~15 min'
        } else if (activeJob.arrivedAt && !activeJob.startedAt) {
          status = 'at-job'
          currentLocation = {
            lat: parseFloat(activeJob.arrivedLat?.toString() || '0'),
            lng: parseFloat(activeJob.arrivedLng?.toString() || '0'),
          }
        } else if (activeJob.startedAt && !activeJob.completedAt) {
          status = 'working'
          currentLocation = {
            lat: parseFloat(activeJob.arrivedLat?.toString() || '0'),
            lng: parseFloat(activeJob.arrivedLng?.toString() || '0'),
          }
        }
      }

      // Get next scheduled job if available
      const nextJob = memberJobs.find(
        (j) => j.status === 'scheduled' && !j.onMyWayAt
      )

      return {
        id: member.id,
        userId: member.userId,
        name: `${member.firstName} ${member.lastName || ''}`.trim(),
        email: member.email,
        phone: member.phone,
        avatarUrl: member.avatarUrl,
        role: member.role,
        status,
        currentJob,
        nextJob: nextJob
          ? {
              id: nextJob.jobId,
              jobNumber: nextJob.jobNumber,
              customerName:
                `${nextJob.customerFirstName || ''} ${nextJob.customerLastName || ''}`.trim(),
              serviceName: nextJob.serviceName,
              scheduledTime: nextJob.scheduledTime,
            }
          : null,
        currentLocation,
        eta,
        todaysJobCount: memberJobs.length,
        completedJobCount: memberJobs.filter((j) => j.completedAt).length,
      }
    })

    // Calculate daily metrics
    const completedJobs = todaysJobs.filter((j) => j.completedAt)
    const totalDriveTime = completedJobs.reduce(
      (sum, j) => sum + (j.driveTimeMinutes || 0),
      0
    )
    const totalMiles = completedJobs.reduce(
      (sum, j) => sum + parseFloat(j.milesDriven?.toString() || '0'),
      0
    )
    const totalJobTime = completedJobs.reduce(
      (sum, j) => sum + (j.jobDurationMinutes || 0),
      0
    )

    return NextResponse.json({
      team: teamStatus,
      metrics: {
        totalJobs: todaysJobs.length,
        completedJobs: completedJobs.length,
        avgDriveTime:
          completedJobs.length > 0
            ? Math.round(totalDriveTime / completedJobs.length)
            : 0,
        totalMiles: Math.round(totalMiles * 10) / 10,
        totalJobTime: totalJobTime,
        onTimeRate: 94, // Placeholder - would calculate based on scheduled vs actual arrival
      },
      date: dateStr,
    })
  } catch (error) {
    console.error('Error fetching tracking data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    )
  }
}
