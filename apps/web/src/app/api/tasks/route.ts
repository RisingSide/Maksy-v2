import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { tasks, teamMembers, customers, jobs } from '@/db/schema'
import { eq, and, desc, count, gte, lte, or, isNull } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/tasks
 * List all tasks for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // 'incomplete', 'complete'
    const priority = searchParams.get('priority') // 'low', 'medium', 'high', 'urgent'
    const assignedToId = searchParams.get('assignedToId')
    const customerId = searchParams.get('customerId')
    const jobId = searchParams.get('jobId')
    const dueDate = searchParams.get('dueDate') // YYYY-MM-DD (tasks due on or before this date)
    const overdue = searchParams.get('overdue') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'dueDate' // 'dueDate', 'priority', 'recent'

    // Build where conditions
    const whereConditions = [eq(tasks.companyId, context.companyId)]

    if (status) {
      whereConditions.push(eq(tasks.status, status))
    }

    if (priority) {
      whereConditions.push(eq(tasks.priority, priority))
    }

    if (assignedToId) {
      whereConditions.push(eq(tasks.assignedToTeamMemberId, assignedToId))
    }

    if (customerId) {
      whereConditions.push(eq(tasks.linkedCustomerId, customerId))
    }

    if (jobId) {
      whereConditions.push(eq(tasks.linkedJobId, jobId))
    }

    if (dueDate) {
      whereConditions.push(lte(tasks.dueDate, dueDate))
    }

    if (overdue) {
      const today = new Date().toISOString().split('T')[0]
      whereConditions.push(lte(tasks.dueDate, today))
      whereConditions.push(eq(tasks.status, 'incomplete'))
    }

    // Determine sort order - priority ordering: urgent > high > medium > low
    const orderBy =
      sort === 'priority'
        ? [desc(tasks.priority)]
        : sort === 'recent'
          ? [desc(tasks.createdAt)]
          : [tasks.dueDate, desc(tasks.priority)] // Default: due date, then priority

    // Execute query with related data
    const results = await db
      .select({
        task: tasks,
        assignedTo: teamMembers,
        customer: customers,
        job: jobs,
      })
      .from(tasks)
      .leftJoin(teamMembers, eq(tasks.assignedToTeamMemberId, teamMembers.id))
      .leftJoin(customers, eq(tasks.linkedCustomerId, customers.id))
      .leftJoin(jobs, eq(tasks.linkedJobId, jobs.id))
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.companyId, context.companyId))

    // Transform results
    const transformedResults = results.map((r) => ({
      ...r.task,
      assignedTo: r.assignedTo,
      customer: r.customer,
      job: r.job,
    }))

    return NextResponse.json({
      tasks: transformedResults,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedToTeamMemberId: z.string().uuid().optional().nullable(),
  linkedCustomerId: z.string().uuid().optional().nullable(),
  linkedJobId: z.string().uuid().optional().nullable(),
  reminderEnabled: z.boolean().default(false),
  reminderFrequency: z.enum(['once', 'daily', 'weekly']).optional().nullable(),
  reminderType: z.enum(['email', 'sms', 'push']).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = createTaskSchema.parse(body)

    // Verify team member belongs to company (if provided)
    if (validatedData.assignedToTeamMemberId) {
      const teamMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.id, validatedData.assignedToTeamMemberId),
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

    // Verify customer belongs to company (if provided)
    if (validatedData.linkedCustomerId) {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, validatedData.linkedCustomerId),
          eq(customers.companyId, context.companyId)
        ),
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Verify job belongs to company (if provided)
    if (validatedData.linkedJobId) {
      const job = await db.query.jobs.findFirst({
        where: and(
          eq(jobs.id, validatedData.linkedJobId),
          eq(jobs.companyId, context.companyId)
        ),
      })

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Create task
    const [task] = await db
      .insert(tasks)
      .values({
        companyId: context.companyId,
        createdByUserId: context.userId,
        title: validatedData.title,
        description: validatedData.description || null,
        dueDate: validatedData.dueDate || null,
        priority: validatedData.priority,
        status: 'incomplete',
        assignedToTeamMemberId: validatedData.assignedToTeamMemberId || null,
        linkedCustomerId: validatedData.linkedCustomerId || null,
        linkedJobId: validatedData.linkedJobId || null,
        reminderEnabled: validatedData.reminderEnabled,
        reminderFrequency: validatedData.reminderFrequency || null,
        reminderType: validatedData.reminderType || null,
      })
      .returning()

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)

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

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
