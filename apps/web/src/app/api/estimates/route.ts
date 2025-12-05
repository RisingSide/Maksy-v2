import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { estimates, estimateLineItems, customers } from '@/db/schema'
import { eq, and, desc, count, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/estimates
 * List all estimates for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // 'draft', 'sent', 'approved', 'declined'
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate = searchParams.get('endDate') // YYYY-MM-DD
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'recent' // 'recent', 'expiration', 'amount'

    // Build where conditions
    const whereConditions = [eq(estimates.companyId, context.companyId)]

    if (status) {
      whereConditions.push(eq(estimates.status, status as any))
    }

    if (customerId) {
      whereConditions.push(eq(estimates.customerId, customerId))
    }

    if (startDate) {
      whereConditions.push(gte(estimates.createdAt, new Date(startDate)))
    }

    if (endDate) {
      whereConditions.push(lte(estimates.createdAt, new Date(endDate)))
    }

    // Determine sort order
    const orderBy =
      sort === 'expiration'
        ? [estimates.expirationDate]
        : sort === 'amount'
          ? [desc(estimates.total)]
          : [desc(estimates.createdAt)]

    // Execute query with customer data
    const results = await db
      .select({
        estimate: estimates,
        customer: customers,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(estimates)
      .where(eq(estimates.companyId, context.companyId))

    // Transform results
    const transformedResults = results.map((r) => ({
      ...r.estimate,
      customer: r.customer,
    }))

    return NextResponse.json({
      estimates: transformedResults,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: any) {
    console.error('Error fetching estimates:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/estimates
 * Create a new estimate
 */

const lineItemSchema = z.object({
  serviceId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
})

const createEstimateSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  taxRate: z.number().min(0).max(100).default(0), // Percentage
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
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
    const validatedData = createEstimateSchema.parse(body)

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

    // Generate estimate number (format: EST-YYYYMMDD-XXXX)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const [latestEstimate] = await db
      .select({ estimateNumber: estimates.estimateNumber })
      .from(estimates)
      .where(eq(estimates.companyId, context.companyId))
      .orderBy(desc(estimates.createdAt))
      .limit(1)

    let nextNumber = 1
    if (latestEstimate && latestEstimate.estimateNumber) {
      const match = latestEstimate.estimateNumber.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const estimateNumber = `EST-${today}-${String(nextNumber).padStart(4, '0')}`

    // Create estimate
    const [estimate] = await db
      .insert(estimates)
      .values({
        companyId: context.companyId,
        customerId: validatedData.customerId,
        estimateNumber,
        status: 'draft',
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        discountAmount: validatedData.discountAmount.toString(),
        total: total.toString(),
        notes: validatedData.notes || null,
        terms: validatedData.terms || null,
        expirationDate: validatedData.expirationDate || null,
      })
      .returning()

    // Create line items
    if (processedLineItems.length > 0) {
      await db.insert(estimateLineItems).values(
        processedLineItems.map((item) => ({
          estimateId: estimate.id,
          serviceId: item.serviceId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          sortOrder: item.sortOrder,
        }))
      )
    }

    return NextResponse.json(estimate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating estimate:', error)

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
      { error: 'Failed to create estimate' },
      { status: 500 }
    )
  }
}
