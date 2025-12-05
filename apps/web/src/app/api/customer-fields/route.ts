import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customCustomerFields } from '@/db/schema'
import { eq, asc, sql } from 'drizzle-orm'
import { z } from 'zod'

const fieldSchema = z.object({
  fieldName: z.string().min(1).max(100),
  fieldSlug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/),
  fieldType: z.enum([
    'text',
    'number',
    'date',
    'dropdown',
    'checkbox',
    'textarea',
  ]),
  dropdownOptions: z.array(z.string()).nullable().optional(),
  isRequired: z.boolean().optional(),
  showOnBookingPage: z.boolean().optional(),
})

/**
 * GET /api/customer-fields
 * List all custom customer fields
 */
export async function GET() {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fields = await db
      .select()
      .from(customCustomerFields)
      .where(eq(customCustomerFields.companyId, context.companyId))
      .orderBy(asc(customCustomerFields.sortOrder))

    return NextResponse.json({
      fields: fields.map((f) => ({
        id: f.id,
        fieldName: f.fieldName,
        fieldSlug: f.fieldSlug,
        fieldType: f.fieldType,
        dropdownOptions: f.dropdownOptions,
        isRequired: f.isRequired,
        showOnBookingPage: f.showOnBookingPage,
        sortOrder: f.sortOrder,
      })),
    })
  } catch (error) {
    console.error('Error fetching customer fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer fields' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customer-fields
 * Create a new custom customer field
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = fieldSchema.parse(body)

    // Get the next sort order
    const maxSortOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(sort_order), 0)` })
      .from(customCustomerFields)
      .where(eq(customCustomerFields.companyId, context.companyId))

    const nextSortOrder = (maxSortOrder[0]?.max || 0) + 1

    // Create field
    const [field] = await db
      .insert(customCustomerFields)
      .values({
        companyId: context.companyId,
        fieldName: validatedData.fieldName,
        fieldSlug: validatedData.fieldSlug,
        fieldType: validatedData.fieldType,
        dropdownOptions: validatedData.dropdownOptions || null,
        isRequired: validatedData.isRequired ?? false,
        showOnBookingPage: validatedData.showOnBookingPage ?? false,
        sortOrder: nextSortOrder,
      })
      .returning()

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
    console.error('Error creating customer field:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create customer field' },
      { status: 500 }
    )
  }
}
