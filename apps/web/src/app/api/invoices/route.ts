import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { invoices, invoiceLineItems, customers } from '@/db/schema'
import { eq, and, desc, count, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/invoices
 * List all invoices for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // 'draft', 'unpaid', 'paid', 'partially_paid', 'overdue', 'canceled'
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate = searchParams.get('endDate') // YYYY-MM-DD
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'recent' // 'recent', 'dueDate', 'amount'

    // Build where conditions
    const whereConditions = [eq(invoices.companyId, context.companyId)]

    if (status) {
      whereConditions.push(eq(invoices.status, status as any))
    }

    if (customerId) {
      whereConditions.push(eq(invoices.customerId, customerId))
    }

    if (startDate) {
      whereConditions.push(gte(invoices.issueDate, startDate))
    }

    if (endDate) {
      whereConditions.push(lte(invoices.issueDate, endDate))
    }

    // Determine sort order
    const orderBy =
      sort === 'dueDate'
        ? [invoices.dueDate]
        : sort === 'amount'
          ? [desc(invoices.total)]
          : [desc(invoices.createdAt)]

    // Execute query with customer data
    const results = await db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.companyId, context.companyId))

    // Transform results
    const transformedResults = results.map((r) => ({
      ...r.invoice,
      customer: r.customer,
    }))

    return NextResponse.json({
      invoices: transformedResults,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
 */

const lineItemSchema = z.object({
  serviceId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
})

const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  jobId: z.string().uuid().optional().nullable(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  taxRate: z.number().min(0).max(100).default(0), // Percentage
  discountAmount: z.number().min(0).default(0),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, 'At least one line item is required'),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = createInvoiceSchema.parse(body)

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

    // Calculate totals
    let subtotal = 0
    const processedLineItems = validatedData.lineItems.map((item, index) => {
      const totalPrice = item.quantity * item.unitPrice
      subtotal += totalPrice
      return {
        ...item,
        totalPrice,
        sortOrder: index,
      }
    })

    const taxAmount = (subtotal * validatedData.taxRate) / 100
    const total = subtotal + taxAmount - validatedData.discountAmount

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const [latestInvoice] = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.companyId, context.companyId))
      .orderBy(desc(invoices.createdAt))
      .limit(1)

    let nextNumber = 1
    if (latestInvoice && latestInvoice.invoiceNumber) {
      const match = latestInvoice.invoiceNumber.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const invoiceNumber = `INV-${today}-${String(nextNumber).padStart(4, '0')}`

    // Create invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        companyId: context.companyId,
        customerId: validatedData.customerId,
        jobId: validatedData.jobId || null,
        invoiceNumber,
        status: 'draft',
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        discountAmount: validatedData.discountAmount.toString(),
        total: total.toString(),
        paymentTerms: validatedData.paymentTerms || null,
        notes: validatedData.notes || null,
      })
      .returning()

    // Create line items
    if (processedLineItems.length > 0) {
      await db.insert(invoiceLineItems).values(
        processedLineItems.map((item) => ({
          invoiceId: invoice.id,
          serviceId: item.serviceId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          sortOrder: item.sortOrder,
        }))
      )
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)

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
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
