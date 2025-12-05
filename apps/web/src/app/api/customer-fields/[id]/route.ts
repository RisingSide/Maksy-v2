import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customCustomerFields, customerFieldValues } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateFieldSchema = z.object({
  fieldName: z.string().min(1).max(100).optional(),
  fieldSlug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  fieldType: z
    .enum(['text', 'number', 'date', 'dropdown', 'checkbox', 'textarea'])
    .optional(),
  dropdownOptions: z.array(z.string()).nullable().optional(),
  isRequired: z.boolean().optional(),
  showOnBookingPage: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

/**
 * GET /api/customer-fields/[id]
 * Get a single custom field
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

    const field = await db.query.customCustomerFields.findFirst({
      where: and(
        eq(customCustomerFields.id, id),
        eq(customCustomerFields.companyId, context.companyId)
      ),
    })

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    return NextResponse.json({
      field: {
        id: field.id,
        fieldName: field.fieldName,
        fieldSlug: field.fieldSlug,
        fieldType: field.fieldType,
        dropdownOptions: field.dropdownOptions,
        isRequired: field.isRequired,
        showOnBookingPage: field.showOnBookingPage,
        sortOrder: field.sortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching customer field:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer field' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/customer-fields/[id]
 * Update a custom field
 */
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
    const validatedData = updateFieldSchema.parse(body)

    // Verify field belongs to company
    const existingField = await db.query.customCustomerFields.findFirst({
      where: and(
        eq(customCustomerFields.id, id),
        eq(customCustomerFields.companyId, context.companyId)
      ),
    })

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.fieldName !== undefined) {
      updateData.fieldName = validatedData.fieldName
    }
    if (validatedData.fieldSlug !== undefined) {
      updateData.fieldSlug = validatedData.fieldSlug
    }
    if (validatedData.fieldType !== undefined) {
      updateData.fieldType = validatedData.fieldType
    }
    if (validatedData.dropdownOptions !== undefined) {
      updateData.dropdownOptions = validatedData.dropdownOptions
    }
    if (validatedData.isRequired !== undefined) {
      updateData.isRequired = validatedData.isRequired
    }
    if (validatedData.showOnBookingPage !== undefined) {
      updateData.showOnBookingPage = validatedData.showOnBookingPage
    }
    if (validatedData.sortOrder !== undefined) {
      updateData.sortOrder = validatedData.sortOrder
    }

    const [updatedField] = await db
      .update(customCustomerFields)
      .set(updateData)
      .where(eq(customCustomerFields.id, id))
      .returning()

    return NextResponse.json({
      field: {
        id: updatedField.id,
        fieldName: updatedField.fieldName,
        fieldSlug: updatedField.fieldSlug,
        fieldType: updatedField.fieldType,
        dropdownOptions: updatedField.dropdownOptions,
        isRequired: updatedField.isRequired,
        showOnBookingPage: updatedField.showOnBookingPage,
        sortOrder: updatedField.sortOrder,
      },
    })
  } catch (error) {
    console.error('Error updating customer field:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update customer field' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customer-fields/[id]
 * Delete a custom field and all associated values
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

    // Verify field belongs to company
    const existingField = await db.query.customCustomerFields.findFirst({
      where: and(
        eq(customCustomerFields.id, id),
        eq(customCustomerFields.companyId, context.companyId)
      ),
    })

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    // Delete all field values first (cascade should handle this, but being explicit)
    await db
      .delete(customerFieldValues)
      .where(eq(customerFieldValues.customFieldId, id))

    // Delete the field
    await db.delete(customCustomerFields).where(eq(customCustomerFields.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer field:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer field' },
      { status: 500 }
    )
  }
}
