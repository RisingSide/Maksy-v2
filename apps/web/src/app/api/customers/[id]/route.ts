import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
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

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, id),
        eq(customers.companyId, context.companyId)
      ),
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error fetching customer:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/customers/[id]
 * Update a customer
 */

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
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
    const validatedData = updateCustomerSchema.parse(body)

    // Prepare update data - use camelCase for Drizzle
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.firstName !== undefined)
      updateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined)
      updateData.lastName = validatedData.lastName
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email || ''
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone || ''
    if (validatedData.companyName !== undefined)
      updateData.companyName = validatedData.companyName
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes

    // Handle address fields
    if (validatedData.address) {
      if (validatedData.address.street !== undefined)
        updateData.addressLine1 = validatedData.address.street
      if (validatedData.address.city !== undefined)
        updateData.city = validatedData.address.city
      if (validatedData.address.state !== undefined)
        updateData.state = validatedData.address.state
      if (validatedData.address.zip !== undefined)
        updateData.zipCode = validatedData.address.zip
      if (validatedData.address.country !== undefined)
        updateData.country = validatedData.address.country
    }

    // Update customer
    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(
        and(eq(customers.id, id), eq(customers.companyId, context.companyId))
      )
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating customer:', error)

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
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer permanently
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

    const [deleted] = await db
      .delete(customers)
      .where(
        and(eq(customers.id, id), eq(customers.companyId, context.companyId))
      )
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    })
  } catch (error: unknown) {
    console.error('Error deleting customer:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
