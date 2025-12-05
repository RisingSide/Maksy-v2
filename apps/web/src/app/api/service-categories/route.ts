import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { serviceCategories } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/service-categories
 * List all service categories for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.companyId, context.companyId))
      .orderBy(serviceCategories.sortOrder, serviceCategories.name)

    return NextResponse.json({
      categories: results,
      total: results.length,
    })
  } catch (error: any) {
    console.error('Error fetching service categories:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch service categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/service-categories
 * Create a new service category
 */

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  sortOrder: z.number().int().default(0),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = createCategorySchema.parse(body)

    // Check if slug is unique for this company
    const existingCategory = await db.query.serviceCategories.findFirst({
      where: and(
        eq(serviceCategories.companyId, context.companyId),
        eq(serviceCategories.slug, validatedData.slug)
      ),
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      )
    }

    // Create category
    const [category] = await db
      .insert(serviceCategories)
      .values({
        companyId: context.companyId,
        name: validatedData.name,
        slug: validatedData.slug,
        sortOrder: validatedData.sortOrder,
      })
      .returning()

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error creating service category:', error)

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
      { error: 'Failed to create service category' },
      { status: 500 }
    )
  }
}
