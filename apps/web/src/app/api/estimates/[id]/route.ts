import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { estimates, estimateLineItems, customers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/estimates/[id]
 * Get a single estimate by ID with line items
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Get estimate with customer
    const result = await db
      .select({
        estimate: estimates,
        customer: customers,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )
      .limit(1)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Get line items
    const lineItems = await db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, id))
      .orderBy(estimateLineItems.sortOrder)

    const estimateWithDetails = {
      ...result[0].estimate,
      customer: result[0].customer,
      lineItems,
    }

    return NextResponse.json(estimateWithDetails)
  } catch (error: any) {
    console.error('Error fetching estimate:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/estimates/[id]
 * Update an estimate
 */

const lineItemSchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
})

const updateEstimateSchema = z.object({
  customerId: z.string().uuid().optional(),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  taxRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).optional(),
})

export async function PATCH(
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
    const validatedData = updateEstimateSchema.parse(body)

    // Check if estimate exists and belongs to company
    const existingEstimate = await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, id),
        eq(estimates.companyId, context.companyId)
      ),
    })

    if (!existingEstimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Don't allow editing approved/declined estimates
    if (
      existingEstimate.status === 'approved' ||
      existingEstimate.status === 'declined'
    ) {
      return NextResponse.json(
        {
          error: `Cannot edit an estimate that has been ${existingEstimate.status}`,
        },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.customerId !== undefined)
      updateData.customerId = validatedData.customerId
    if (validatedData.expirationDate !== undefined)
      updateData.expirationDate = validatedData.expirationDate
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes
    if (validatedData.terms !== undefined)
      updateData.terms = validatedData.terms

    // If line items are provided, recalculate totals with new line items
    if (validatedData.lineItems) {
      // Delete existing line items
      await db
        .delete(estimateLineItems)
        .where(eq(estimateLineItems.estimateId, id))

      // Calculate new totals
      let subtotal = 0
      const processedLineItems = validatedData.lineItems.map((item, index) => {
        const totalPrice = item.quantity * item.unitPrice
        subtotal += totalPrice
        return {
          estimateId: id,
          serviceId: item.serviceId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: totalPrice.toString(),
          sortOrder: index,
        }
      })

      const taxRate = validatedData.taxRate ?? 0
      const discountAmount =
        validatedData.discountAmount ??
        parseFloat(existingEstimate.discountAmount)
      const taxAmount = (subtotal * taxRate) / 100
      const total = subtotal + taxAmount - discountAmount

      updateData.subtotal = subtotal.toString()
      updateData.taxAmount = taxAmount.toString()
      updateData.discountAmount = discountAmount.toString()
      updateData.total = total.toString()

      // Insert new line items
      if (processedLineItems.length > 0) {
        await db.insert(estimateLineItems).values(processedLineItems)
      }
    } else if (
      validatedData.taxRate !== undefined ||
      validatedData.discountAmount !== undefined
    ) {
      // Handle standalone tax/discount updates without changing line items
      // Recalculate totals using existing subtotal
      const currentSubtotal = parseFloat(existingEstimate.subtotal)
      const taxRate = validatedData.taxRate ?? 0
      const discountAmount =
        validatedData.discountAmount ??
        parseFloat(existingEstimate.discountAmount)
      const taxAmount = (currentSubtotal * taxRate) / 100
      const total = currentSubtotal + taxAmount - discountAmount

      updateData.taxAmount = taxAmount.toString()
      updateData.discountAmount = discountAmount.toString()
      updateData.total = total.toString()
    }

    // Update estimate
    const [updated] = await db
      .update(estimates)
      .set(updateData)
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating estimate:', error)

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
      { error: 'Failed to update estimate' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/estimates/[id]
 * Delete an estimate
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Check if estimate exists and belongs to company
    const existingEstimate = await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, id),
        eq(estimates.companyId, context.companyId)
      ),
    })

    if (!existingEstimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Delete estimate (line items cascade)
    await db
      .delete(estimates)
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )

    return NextResponse.json({
      success: true,
      message: 'Estimate deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting estimate:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    )
  }
}
