import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { invoices, invoiceLineItems, customers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/invoices/[id]
 * Get a single invoice by ID with line items
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

    // Get invoice with customer
    const result = await db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(eq(invoices.id, id), eq(invoices.companyId, context.companyId))
      )
      .limit(1)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get line items
    const lineItems = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id))
      .orderBy(invoiceLineItems.sortOrder)

    const invoiceWithDetails = {
      ...result[0].invoice,
      customer: result[0].customer,
      lineItems,
    }

    return NextResponse.json(invoiceWithDetails)
  } catch (error: any) {
    console.error('Error fetching invoice:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/invoices/[id]
 * Update an invoice
 */

const lineItemSchema = z.object({
  id: z.string().uuid().optional(), // Existing item ID for updates
  serviceId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
})

const updateInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional().nullable(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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
    const validatedData = updateInvoiceSchema.parse(body)

    // Check if invoice exists and belongs to company
    const existingInvoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.companyId, context.companyId)
      ),
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Don't allow editing paid invoices
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot edit a paid invoice' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.customerId !== undefined)
      updateData.customerId = validatedData.customerId
    if (validatedData.jobId !== undefined)
      updateData.jobId = validatedData.jobId
    if (validatedData.issueDate !== undefined)
      updateData.issueDate = validatedData.issueDate
    if (validatedData.dueDate !== undefined)
      updateData.dueDate = validatedData.dueDate
    if (validatedData.paymentTerms !== undefined)
      updateData.paymentTerms = validatedData.paymentTerms
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes

    // If line items are provided, recalculate totals
    if (validatedData.lineItems) {
      // Delete existing line items
      await db
        .delete(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, id))

      // Calculate new totals
      let subtotal = 0
      const processedLineItems = validatedData.lineItems.map((item, index) => {
        const totalPrice = item.quantity * item.unitPrice
        subtotal += totalPrice
        return {
          invoiceId: id,
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
        parseFloat(existingInvoice.discountAmount)
      const taxAmount = (subtotal * taxRate) / 100
      const total = subtotal + taxAmount - discountAmount

      updateData.subtotal = subtotal.toString()
      updateData.taxAmount = taxAmount.toString()
      updateData.discountAmount = discountAmount.toString()
      updateData.total = total.toString()

      // Insert new line items
      if (processedLineItems.length > 0) {
        await db.insert(invoiceLineItems).values(processedLineItems)
      }
    }

    // Update invoice
    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(
        and(eq(invoices.id, id), eq(invoices.companyId, context.companyId))
      )
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating invoice:', error)

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
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete an invoice
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

    // Check if invoice exists and belongs to company
    const existingInvoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.companyId, context.companyId)
      ),
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Don't allow deleting paid invoices
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete a paid invoice' },
        { status: 400 }
      )
    }

    // Delete invoice (line items cascade)
    await db
      .delete(invoices)
      .where(
        and(eq(invoices.id, id), eq(invoices.companyId, context.companyId))
      )

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting invoice:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
