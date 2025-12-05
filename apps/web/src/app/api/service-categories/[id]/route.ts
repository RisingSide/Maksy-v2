import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { serviceCategories } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/service-categories/[id]
 * Get a single service category by ID
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

    const category = await db.query.serviceCategories.findFirst({
      where: and(
        eq(serviceCategories.id, id),
        eq(serviceCategories.companyId, context.companyId)
      ),
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error fetching service category:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch service category' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/service-categories/[id]
 * Update a service category
 */

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  sortOrder: z.number().int().optional(),
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
    const validatedData = updateCategorySchema.parse(body)

    // Check if category exists and belongs to company
    const existingCategory = await db.query.serviceCategories.findFirst({
      where: and(
        eq(serviceCategories.id, id),
        eq(serviceCategories.companyId, context.companyId)
      ),
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      )
    }

    // If updating slug, check it's unique
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const slugConflict = await db.query.serviceCategories.findFirst({
        where: and(
          eq(serviceCategories.companyId, context.companyId),
          eq(serviceCategories.slug, validatedData.slug)
        ),
      })

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.sortOrder !== undefined)
      updateData.sortOrder = validatedData.sortOrder

    updateData.updatedAt = new Date()

    // Update category
    const [updated] = await db
      .update(serviceCategories)
      .set(updateData)
      .where(
        and(
          eq(serviceCategories.id, id),
          eq(serviceCategories.companyId, context.companyId)
        )
      )
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating service category:', error)

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
      { error: 'Failed to update service category' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/service-categories/[id]
 * Delete a service category
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

    // Check if category exists and belongs to company
    const existingCategory = await db.query.serviceCategories.findFirst({
      where: and(
        eq(serviceCategories.id, id),
        eq(serviceCategories.companyId, context.companyId)
      ),
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      )
    }

    // Delete category (services will have their categoryId set to null via onDelete: 'set null')
    await db
      .delete(serviceCategories)
      .where(
        and(
          eq(serviceCategories.id, id),
          eq(serviceCategories.companyId, context.companyId)
        )
      )

    return NextResponse.json({
      success: true,
      message: 'Service category deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting service category:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete service category' },
      { status: 500 }
    )
  }
}
