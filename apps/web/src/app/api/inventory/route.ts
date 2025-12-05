import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { inventoryItems } from '@/db/schema'
import { eq, and, or, like, desc, count, lte, isNull } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/inventory
 * List all inventory items for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const whereConditions: any[] = [
      eq(inventoryItems.companyId, context.companyId),
    ]

    // Only include non-archived items unless specifically requested
    if (!includeArchived) {
      whereConditions.push(isNull(inventoryItems.archivedAt))
    }

    if (search) {
      whereConditions.push(
        or(
          like(inventoryItems.name, `%${search}%`),
          like(inventoryItems.sku, `%${search}%`),
          like(inventoryItems.notes, `%${search}%`)
        )
      )
    }

    if (category) {
      whereConditions.push(eq(inventoryItems.category, category))
    }

    // Low stock filter: quantity <= reorder point
    // Note: This is a simplified check since Drizzle decimal comparison is complex
    // In production, you might want to use raw SQL for precise decimal comparison

    const whereClause = and(...whereConditions)

    // Execute query with pagination
    const [items, countResult] = await Promise.all([
      db.query.inventoryItems.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(inventoryItems.updatedAt)],
      }),
      db.select({ count: count() }).from(inventoryItems).where(whereClause),
    ])

    // Filter low stock items in memory if requested
    // (This is needed because Drizzle doesn't easily support decimal column comparisons)
    let filteredItems = items
    if (lowStock) {
      filteredItems = items.filter((item) => {
        const qty = parseFloat(item.quantityOnHand || '0')
        const reorder = parseFloat(item.reorderPoint || '0')
        return qty <= reorder
      })
    }

    const total = countResult[0]?.count ?? 0

    return NextResponse.json({
      items: filteredItems,
      total,
      hasMore: offset + items.length < total,
    })
  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item
 */
const createInventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitCost: z
    .number()
    .min(0, 'Unit cost must be positive')
    .optional()
    .nullable(),
  quantityOnHand: z.number().default(0),
  reorderPoint: z.number().min(0, 'Reorder point must be positive').default(0),
  preferredVendor: z.string().optional().nullable(),
  locationTag: z.string().optional().nullable(),
  trackConsumption: z.boolean().default(false),
  notes: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInventorySchema.parse(body)

    // Check if SKU is unique for this company (if provided)
    if (validatedData.sku) {
      const existingItem = await db.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.companyId, context.companyId),
          eq(inventoryItems.sku, validatedData.sku)
        ),
      })

      if (existingItem) {
        return NextResponse.json(
          { error: 'An item with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Create inventory item
    const [item] = await db
      .insert(inventoryItems)
      .values({
        companyId: context.companyId,
        name: validatedData.name,
        sku: validatedData.sku || null,
        category: validatedData.category || null,
        unitCost: validatedData.unitCost?.toString() || null,
        quantityOnHand: validatedData.quantityOnHand.toString(),
        reorderPoint: validatedData.reorderPoint.toString(),
        preferredVendor: validatedData.preferredVendor || null,
        locationTag: validatedData.locationTag || null,
        trackConsumption: validatedData.trackConsumption,
        notes: validatedData.notes || null,
      })
      .returning()

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('Error creating inventory item:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Check for duplicate SKU constraint
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'An item with this SKU already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}
