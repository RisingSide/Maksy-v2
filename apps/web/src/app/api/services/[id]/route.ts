import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { services, serviceCategories } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/services/[id]
 * Get a single service by ID
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

    const result = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .leftJoin(
        serviceCategories,
        eq(services.categoryId, serviceCategories.id)
      )
      .where(
        and(eq(services.id, id), eq(services.companyId, context.companyId))
      )
      .limit(1)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const serviceWithCategory = {
      ...result[0].service,
      category: result[0].category,
    }

    return NextResponse.json(serviceWithCategory)
  } catch (error: any) {
    console.error('Error fetching service:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/services/[id]
 * Update a service
 */

const updateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be positive').optional(),
  durationMinutes: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .optional(),
  categoryId: z.string().uuid().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  iconCropStyle: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code')
    .optional(),
  isPublic: z.boolean().optional(),
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
    const validatedData = updateServiceSchema.parse(body)

    // Check if service exists and belongs to company
    const existingService = await db.query.services.findFirst({
      where: and(
        eq(services.id, id),
        eq(services.companyId, context.companyId)
      ),
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // If updating slug, check it's unique
    if (validatedData.slug && validatedData.slug !== existingService.slug) {
      const slugConflict = await db.query.services.findFirst({
        where: and(
          eq(services.companyId, context.companyId),
          eq(services.slug, validatedData.slug)
        ),
      })

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A service with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.price !== undefined)
      updateData.price = validatedData.price.toString()
    if (validatedData.durationMinutes !== undefined)
      updateData.durationMinutes = validatedData.durationMinutes
    if (validatedData.categoryId !== undefined)
      updateData.categoryId = validatedData.categoryId
    if (validatedData.iconUrl !== undefined)
      updateData.iconUrl = validatedData.iconUrl
    if (validatedData.iconCropStyle !== undefined)
      updateData.iconCropStyle = validatedData.iconCropStyle
    if (validatedData.color !== undefined)
      updateData.color = validatedData.color
    if (validatedData.isPublic !== undefined)
      updateData.isPublic = validatedData.isPublic
    if (validatedData.sortOrder !== undefined)
      updateData.sortOrder = validatedData.sortOrder

    updateData.updatedAt = new Date()

    // Update service
    const [updated] = await db
      .update(services)
      .set(updateData)
      .where(
        and(eq(services.id, id), eq(services.companyId, context.companyId))
      )
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating service:', error)

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
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/services/[id]
 * Delete a service (soft delete by setting deleted_at)
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

    // Check if service exists and belongs to company
    const existingService = await db.query.services.findFirst({
      where: and(
        eq(services.id, id),
        eq(services.companyId, context.companyId)
      ),
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Hard delete (can be changed to soft delete if needed)
    await db
      .delete(services)
      .where(
        and(eq(services.id, id), eq(services.companyId, context.companyId))
      )

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting service:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for foreign key constraint (service is being used)
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error:
            'Cannot delete service that is being used in jobs, estimates, or invoices',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
