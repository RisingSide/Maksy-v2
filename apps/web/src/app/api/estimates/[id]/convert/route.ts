import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  estimates,
  estimateLineItems,
  invoices,
  invoiceLineItems,
  jobs,
  services,
} from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'

/**
 * POST /api/estimates/[id]/convert
 * Convert an approved estimate to a job and/or invoice
 */

const convertEstimateSchema = z.object({
  createJob: z.boolean().default(false),
  createInvoice: z.boolean().default(false),
  // Job fields (required if createJob is true)
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
  assignedTeamMemberId: z.string().uuid().optional().nullable(),
  // Invoice fields (required if createInvoice is true)
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = convertEstimateSchema.parse(body)

    if (!validatedData.createJob && !validatedData.createInvoice) {
      return NextResponse.json(
        { error: 'Must create at least a job or invoice' },
        { status: 400 }
      )
    }

    // Get estimate with line items
    const existingEstimate = await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, id),
        eq(estimates.companyId, context.companyId)
      ),
    })

    if (!existingEstimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Only allow converting approved estimates
    if (existingEstimate.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved estimates can be converted' },
        { status: 400 }
      )
    }

    // Get estimate line items
    const lineItems = await db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, id))
      .orderBy(estimateLineItems.sortOrder)

    const result: { job?: any; invoice?: any } = {}

    // Create job if requested
    if (validatedData.createJob) {
      if (!validatedData.scheduledDate || !validatedData.scheduledTime) {
        return NextResponse.json(
          {
            error:
              'scheduledDate and scheduledTime are required to create a job',
          },
          { status: 400 }
        )
      }

      // Get the first service from line items (for job service)
      const firstServiceItem = lineItems.find((item) => item.serviceId)

      if (!firstServiceItem?.serviceId) {
        return NextResponse.json(
          {
            error: 'Cannot create job: no service found in estimate line items',
          },
          { status: 400 }
        )
      }

      // Get service duration
      const service = await db.query.services.findFirst({
        where: eq(services.id, firstServiceItem.serviceId),
      })

      // Generate job number
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const [latestJob] = await db
        .select({ jobNumber: jobs.jobNumber })
        .from(jobs)
        .where(eq(jobs.companyId, context.companyId))
        .orderBy(desc(jobs.createdAt))
        .limit(1)

      let nextJobNumber = 1
      if (latestJob && latestJob.jobNumber) {
        const match = latestJob.jobNumber.match(/-(\d+)$/)
        if (match) {
          nextJobNumber = parseInt(match[1]) + 1
        }
      }

      const jobNumber = `JOB-${today}-${String(nextJobNumber).padStart(4, '0')}`

      // Create job
      const [job] = await db
        .insert(jobs)
        .values({
          companyId: context.companyId,
          customerId: existingEstimate.customerId,
          serviceId: firstServiceItem.serviceId,
          assignedTeamMemberId: validatedData.assignedTeamMemberId || null,
          jobNumber,
          scheduledDate: validatedData.scheduledDate,
          scheduledTime: validatedData.scheduledTime,
          durationMinutes: service?.durationMinutes || 60,
          status: 'scheduled',
          totalPrice: existingEstimate.total,
          notes: existingEstimate.notes,
        })
        .returning()

      result.job = job
    }

    // Create invoice if requested
    if (validatedData.createInvoice) {
      if (!validatedData.issueDate || !validatedData.dueDate) {
        return NextResponse.json(
          { error: 'issueDate and dueDate are required to create an invoice' },
          { status: 400 }
        )
      }

      // Generate invoice number
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const [latestInvoice] = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .where(eq(invoices.companyId, context.companyId))
        .orderBy(desc(invoices.createdAt))
        .limit(1)

      let nextInvoiceNumber = 1
      if (latestInvoice && latestInvoice.invoiceNumber) {
        const match = latestInvoice.invoiceNumber.match(/-(\d+)$/)
        if (match) {
          nextInvoiceNumber = parseInt(match[1]) + 1
        }
      }

      const invoiceNumber = `INV-${today}-${String(nextInvoiceNumber).padStart(4, '0')}`

      // Create invoice
      const [invoice] = await db
        .insert(invoices)
        .values({
          companyId: context.companyId,
          customerId: existingEstimate.customerId,
          jobId: result.job?.id || null,
          invoiceNumber,
          status: 'draft',
          issueDate: validatedData.issueDate,
          dueDate: validatedData.dueDate,
          subtotal: existingEstimate.subtotal,
          taxAmount: existingEstimate.taxAmount,
          discountAmount: existingEstimate.discountAmount,
          total: existingEstimate.total,
          notes: existingEstimate.notes,
        })
        .returning()

      // Copy line items to invoice
      if (lineItems.length > 0) {
        await db.insert(invoiceLineItems).values(
          lineItems.map((item) => ({
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            sortOrder: item.sortOrder,
          }))
        )
      }

      result.invoice = invoice
    }

    return NextResponse.json({
      success: true,
      message: `Estimate converted to ${[
        result.job ? 'job' : null,
        result.invoice ? 'invoice' : null,
      ]
        .filter(Boolean)
        .join(' and ')}`,
      ...result,
    })
  } catch (error: any) {
    console.error('Error converting estimate:', error)

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
      { error: 'Failed to convert estimate' },
      { status: 500 }
    )
  }
}
