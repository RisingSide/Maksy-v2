import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  inventoryItems,
  inventoryMovements,
  inventoryAttachments,
} from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/inventory/[id]
 * Get a single inventory item with its movements and attachments
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

    // Get item with related data
    const item = await db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.companyId, context.companyId)
      ),
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Get recent movements
    const movements = await db.query.inventoryMovements.findMany({
      where: eq(inventoryMovements.itemId, id),
      orderBy: [desc(inventoryMovements.createdAt)],
      limit: 20,
    })

    // Get attachments
    const attachments = await db.query.inventoryAttachments.findMany({
      where: eq(inventoryAttachments.itemId, id),
    })

    return NextResponse.json({
      ...item,
      movements,
      attachments,
    })
  } catch (error: any) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/inventory/[id]
 * Update an inventory item
 */
const updateInventorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitCost: z
    .number()
    .min(0, 'Unit cost must be positive')
    .optional()
    .nullable(),
  quantityOnHand: z.number().optional(),
  reorderPoint: z.number().min(0, 'Reorder point must be positive').optional(),
  preferredVendor: z.string().optional().nullable(),
  locationTag: z.string().optional().nullable(),
  trackConsumption: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  archived: z.boolean().optional(), // Set to true to archive, false to unarchive
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
    const validatedData = updateInventorySchema.parse(body)

    // Check if item exists and belongs to company
    const existingItem = await db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.companyId, context.companyId)
      ),
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // If updating SKU, check it's unique
    if (validatedData.sku && validatedData.sku !== existingItem.sku) {
      const skuConflict = await db.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.companyId, context.companyId),
          eq(inventoryItems.sku, validatedData.sku)
        ),
      })

      if (skuConflict) {
        return NextResponse.json(
          { error: 'An item with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: any = { updatedAt: new Date() }

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.sku !== undefined) updateData.sku = validatedData.sku
    if (validatedData.category !== undefined)
      updateData.category = validatedData.category
    if (validatedData.unitCost !== undefined)
      updateData.unitCost = validatedData.unitCost?.toString() ?? null
    if (validatedData.quantityOnHand !== undefined)
      updateData.quantityOnHand = validatedData.quantityOnHand.toString()
    if (validatedData.reorderPoint !== undefined)
      updateData.reorderPoint = validatedData.reorderPoint.toString()
    if (validatedData.preferredVendor !== undefined)
      updateData.preferredVendor = validatedData.preferredVendor
    if (validatedData.locationTag !== undefined)
      updateData.locationTag = validatedData.locationTag
    if (validatedData.trackConsumption !== undefined)
      updateData.trackConsumption = validatedData.trackConsumption
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes

    // Handle archiving
    if (validatedData.archived === true) {
      updateData.archivedAt = new Date()
    } else if (validatedData.archived === false) {
      updateData.archivedAt = null
    }

    // Update item
    const [updated] = await db
      .update(inventoryItems)
      .set(updateData)
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.companyId, context.companyId)
        )
      )
      .returning()

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating inventory item:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inventory/[id]
 * Delete an inventory item (soft delete by archiving)
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
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Check if item exists and belongs to company
    const existingItem = await db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.companyId, context.companyId)
      ),
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (permanent) {
      // Hard delete - remove item and all related records
      await db
        .delete(inventoryItems)
        .where(
          and(
            eq(inventoryItems.id, id),
            eq(inventoryItems.companyId, context.companyId)
          )
        )

      return NextResponse.json({
        success: true,
        message: 'Item permanently deleted',
      })
    } else {
      // Soft delete - archive the item
      await db
        .update(inventoryItems)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(inventoryItems.id, id),
            eq(inventoryItems.companyId, context.companyId)
          )
        )

      return NextResponse.json({ success: true, message: 'Item archived' })
    }
  } catch (error: any) {
    console.error('Error deleting inventory item:', error)

    // Check for foreign key constraint
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error:
            'Cannot delete item that has movement history. Archive it instead.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
