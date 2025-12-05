import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customers } from '@/db/schema'
import { eq, and, or, like, desc, count } from 'drizzle-orm'
import { z } from 'zod'
import { withApiSecurity, apiSecurityPresets } from '@/lib/api-security'
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '@/lib/sanitization'

/**
 * GET /api/customers
 * List all customers for the authenticated user's company
 * Excludes soft-deleted customers unless ?includeDeleted=true
 */
export const GET = withApiSecurity(async (request: NextRequest) => {
  try {
    const context = (request as any).auth || (await getAuthContext())
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'recent' // 'name', 'recent', 'ltv'

    // Build where conditions
    const whereConditions = [eq(customers.companyId, context.companyId)]

    if (search) {
      whereConditions.push(
        or(
          like(customers.firstName, `%${search}%`),
          like(customers.lastName, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phone, `%${search}%`),
          like(customers.companyName, `%${search}%`)
        )!
      )
    }

    // Build and execute query with combined where clause and sorting
    const results = await db
      .select()
      .from(customers)
      .where(and(...whereConditions))
      .orderBy(
        ...(sort === 'name'
          ? [customers.firstName, customers.lastName]
          : [desc(customers.createdAt)])
      )
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.companyId, context.companyId))

    return NextResponse.json({
      customers: results,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: unknown) {
    console.error('Error fetching customers:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}, apiSecurityPresets.authenticated)

/**
 * POST /api/customers
 * Create a new customer
 */

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
})

export const POST = withApiSecurity(async (request: NextRequest) => {
  try {
    const context = (request as any).auth || (await getAuthContext())
    const body = await request.json()

    // Validate request body
    const validatedData = createCustomerSchema.parse(body)

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(validatedData.firstName),
      lastName: sanitizeInput(validatedData.lastName),
      email: validatedData.email ? sanitizeEmail(validatedData.email) : null,
      phone: validatedData.phone ? sanitizePhone(validatedData.phone) : null,
      companyName: validatedData.companyName
        ? sanitizeInput(validatedData.companyName)
        : null,
      address: validatedData.address
        ? {
            street: validatedData.address.street
              ? sanitizeInput(validatedData.address.street)
              : null,
            city: validatedData.address.city
              ? sanitizeInput(validatedData.address.city)
              : null,
            state: validatedData.address.state
              ? sanitizeInput(validatedData.address.state)
              : null,
            zip: validatedData.address.zip
              ? sanitizeInput(validatedData.address.zip)
              : null,
            country: validatedData.address.country
              ? sanitizeInput(validatedData.address.country)
              : 'US',
          }
        : null,
      notes: validatedData.notes ? sanitizeInput(validatedData.notes) : null,
    }

    // Create customer
    const [customer] = await db
      .insert(customers)
      .values({
        companyId: context.companyId,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email || '',
        phone: sanitizedData.phone || '',
        companyName: sanitizedData.companyName || null,
        addressLine1: sanitizedData.address?.street || null,
        city: sanitizedData.address?.city || null,
        state: sanitizedData.address?.state || null,
        zipCode: sanitizedData.address?.zip || null,
        country: sanitizedData.address?.country || 'US',
        notes: sanitizedData.notes || null,
      })
      .returning()

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)

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

    // Check for duplicate email/phone
    if (error.code === '23505') {
      // Postgres unique violation
      return NextResponse.json(
        { error: 'Customer with this email or phone already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}, apiSecurityPresets.authenticated)
