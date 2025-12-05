import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, customers, services, teamMembers } from '@/db/schema'
import { eq, and, or, gte, lte, desc, count, sql } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/jobs
 * List all jobs for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'
    const teamMemberId = searchParams.get('teamMemberId')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate = searchParams.get('endDate') // YYYY-MM-DD
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'date' // 'date', 'recent', 'customer'

    // Build where conditions
    const whereConditions = [eq(jobs.companyId, context.companyId)]

    if (status) {
      whereConditions.push(eq(jobs.status, status as any))
    }

    if (teamMemberId) {
      whereConditions.push(eq(jobs.assignedTeamMemberId, teamMemberId))
    }

    if (customerId) {
      whereConditions.push(eq(jobs.customerId, customerId))
    }

    if (startDate) {
      whereConditions.push(gte(jobs.scheduledDate, startDate))
    }

    if (endDate) {
      whereConditions.push(lte(jobs.scheduledDate, endDate))
    }

    // Determine sort order
    const orderBy =
      sort === 'recent'
        ? [desc(jobs.createdAt)]
        : sort === 'customer'
          ? [customers.firstName, customers.lastName]
          : [jobs.scheduledDate, jobs.scheduledTime]

    // Execute query with combined where clause and sorting
    const results = await db
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
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.companyId, context.companyId))

    // Transform results to include related data
    const transformedResults = results.map((r) => ({
      ...r.job,
      customer: r.customer,
      service: r.service,
      teamMember: r.teamMember,
    }))

    return NextResponse.json({
      jobs: transformedResults,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

/**
 * POST /api/jobs
 * Create a new job
 */

const createJobSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  serviceId: z.string().uuid('Service ID must be a valid UUID'),
  assignedTeamMemberId: z
    .string()
    .uuid('Team member ID must be a valid UUID')
    .optional()
    .nullable(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  scheduledTime: z
    .string()
    .regex(
      /^\d{2}:\d{2}(:\d{2})?$/,
      'Time must be in HH:MM or HH:MM:SS format'
    ),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  status: z
    .enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .default('scheduled'),
  notes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z
    .enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
    .optional()
    .nullable(),
  recurringUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  totalPrice: z.number().min(0, 'Total price must be positive'),
  paymentStatus: z.enum(['unpaid', 'paid', 'partial']).default('unpaid'),
  paymentMethod: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = createJobSchema.parse(body)

    // Verify customer belongs to company
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, validatedData.customerId),
        eq(customers.companyId, context.companyId)
      ),
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found or does not belong to your company' },
        { status: 404 }
      )
    }

    // Verify service belongs to company
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, validatedData.serviceId),
        eq(services.companyId, context.companyId)
      ),
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or does not belong to your company' },
        { status: 404 }
      )
    }

    // Verify team member belongs to company (if provided)
    if (validatedData.assignedTeamMemberId) {
      const teamMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.id, validatedData.assignedTeamMemberId),
          eq(teamMembers.companyId, context.companyId)
        ),
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'Team member not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Generate job number (format: JOB-YYYYMMDD-XXXX)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const [latestJob] = await db
      .select({ jobNumber: jobs.jobNumber })
      .from(jobs)
      .where(eq(jobs.companyId, context.companyId))
      .orderBy(desc(jobs.createdAt))
      .limit(1)

    let nextNumber = 1
    if (latestJob && latestJob.jobNumber) {
      const match = latestJob.jobNumber.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const jobNumber = `JOB-${today}-${String(nextNumber).padStart(4, '0')}`

    // Create job
    const [job] = await db
      .insert(jobs)
      .values({
        companyId: context.companyId,
        customerId: validatedData.customerId,
        serviceId: validatedData.serviceId,
        assignedTeamMemberId: validatedData.assignedTeamMemberId || null,
        jobNumber,
        scheduledDate: validatedData.scheduledDate,
        scheduledTime: validatedData.scheduledTime,
        durationMinutes: validatedData.durationMinutes,
        status: validatedData.status,
        notes: validatedData.notes || null,
        customerNotes: validatedData.customerNotes || null,
        isRecurring: validatedData.isRecurring,
        recurringFrequency: validatedData.recurringFrequency || null,
        recurringUntil: validatedData.recurringUntil || null,
        totalPrice: validatedData.totalPrice.toString(),
        paymentStatus: validatedData.paymentStatus,
        paymentMethod: validatedData.paymentMethod || null,
      })
      .returning()

    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for duplicate job number (should be very rare)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Job number conflict, please try again' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
