import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { inventoryItems, inventoryMovements } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * POST /api/inventory/[id]/adjust
 * Record a quantity adjustment for an inventory item
 */
const adjustmentSchema = z.object({
  changeAmount: z.number(), // Positive for adding, negative for removing
  changeType: z.enum([
    'manual',
    'job_consumption',
    'transfer',
    'import',
    'return',
    'damaged',
    'expired',
  ]),
  jobId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: itemId } = await params
    const body = await request.json()
    const validatedData = adjustmentSchema.parse(body)

    // Check if item exists and belongs to company
    const item = await db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, itemId),
        eq(inventoryItems.companyId, context.companyId)
      ),
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Calculate new quantity
    const currentQty = parseFloat(item.quantityOnHand || '0')
    const newQty = currentQty + validatedData.changeAmount

    // Prevent negative inventory (optional - can be removed if negative is allowed)
    if (newQty < 0) {
      return NextResponse.json(
        {
          error: `Insufficient quantity. Current: ${currentQty}, Requested: ${Math.abs(validatedData.changeAmount)}`,
        },
        { status: 400 }
      )
    }

    // Create movement record and update item quantity in a transaction-like manner
    // Note: For true transaction support, use Drizzle's transaction API

    // Create movement record
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        companyId: context.companyId,
        itemId: itemId,
        changeAmount: validatedData.changeAmount.toString(),
        changeType: validatedData.changeType,
        jobId: validatedData.jobId || null,
        notes: validatedData.notes || null,
        createdBy: context.userId,
      })
      .returning()

    // Update item quantity
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        quantityOnHand: newQty.toString(),
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))
      .returning()

    return NextResponse.json({
      item: updatedItem,
      movement,
      previousQuantity: currentQty,
      newQuantity: newQty,
    })
  } catch (error: any) {
    console.error('Error adjusting inventory:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    )
  }
}
