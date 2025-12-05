import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { services, serviceCategories } from '@/db/schema'
import { eq, and, or, like, desc, count } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/services
 * List all services for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const isPublic = searchParams.get('isPublic') // 'true', 'false', or null (all)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'order' // 'name', 'price', 'order', 'recent'

    // Build where conditions
    const whereConditions = [eq(services.companyId, context.companyId)]

    if (search) {
      whereConditions.push(
        or(
          like(services.name, `%${search}%`),
          like(services.description, `%${search}%`)
        )!
      )
    }

    if (categoryId) {
      whereConditions.push(eq(services.categoryId, categoryId))
    }

    if (isPublic === 'true') {
      whereConditions.push(eq(services.isPublic, true))
    } else if (isPublic === 'false') {
      whereConditions.push(eq(services.isPublic, false))
    }

    // Determine sort order
    const orderBy =
      sort === 'name'
        ? [services.name]
        : sort === 'price'
          ? [services.price]
          : sort === 'recent'
            ? [desc(services.createdAt)]
            : [services.sortOrder, services.name]

    // Execute query with combined where clause and sorting
    const results = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .leftJoin(
        serviceCategories,
        eq(services.categoryId, serviceCategories.id)
      )
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(services)
      .where(eq(services.companyId, context.companyId))

    // Transform results to include category data
    const transformedResults = results.map((r) => ({
      ...r.service,
      category: r.category,
    }))

    return NextResponse.json({
      services: transformedResults,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: any) {
    console.error('Error fetching services:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/services
 * Create a new service
 */

const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  categoryId: z.string().uuid().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  iconCropStyle: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code')
    .default('#f4a125'),
  isPublic: z.boolean().default(true),
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
    const validatedData = createServiceSchema.parse(body)

    // Check if slug is unique for this company
    const existingService = await db.query.services.findFirst({
      where: and(
        eq(services.companyId, context.companyId),
        eq(services.slug, validatedData.slug)
      ),
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'A service with this slug already exists' },
        { status: 409 }
      )
    }

    // Create service
    const [service] = await db
      .insert(services)
      .values({
        companyId: context.companyId,
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || null,
        price: validatedData.price.toString(),
        durationMinutes: validatedData.durationMinutes,
        categoryId: validatedData.categoryId || null,
        iconUrl: validatedData.iconUrl || null,
        iconCropStyle: validatedData.iconCropStyle || null,
        color: validatedData.color,
        isPublic: validatedData.isPublic,
        sortOrder: validatedData.sortOrder,
      })
      .returning()

    return NextResponse.json(service, { status: 201 })
  } catch (error: any) {
    console.error('Error creating service:', error)

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

    // Check for duplicate slug (should be caught above, but just in case)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A service with this slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
