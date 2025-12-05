import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { coupons } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  title: z.string().max(100).nullable().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  totalUsageLimit: z.number().int().positive().nullable().optional(),
  usagePerCustomerLimit: z.number().int().positive().nullable().optional(),
  minimumOrderValue: z.number().positive().nullable().optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/coupons/[id]
 * Get a single coupon
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

    const coupon = await db.query.coupons.findFirst({
      where: and(eq(coupons.id, id), eq(coupons.companyId, context.companyId)),
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        totalUsageLimit: coupon.totalUsageLimit,
        usagePerCustomerLimit: coupon.usagePerCustomerLimit,
        isActive: coupon.isActive,
        minimumOrderValue: coupon.minimumOrderValue
          ? parseFloat(coupon.minimumOrderValue)
          : null,
      },
    })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/coupons/[id]
 * Update a coupon
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
    const validatedData = updateCouponSchema.parse(body)

    // Verify coupon belongs to company
    const existingCoupon = await db.query.coupons.findFirst({
      where: and(eq(coupons.id, id), eq(coupons.companyId, context.companyId)),
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.code !== undefined) {
      updateData.code = validatedData.code.toUpperCase()
    }
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }
    if (validatedData.discountType !== undefined) {
      updateData.discountType = validatedData.discountType
    }
    if (validatedData.discountValue !== undefined) {
      updateData.discountValue = validatedData.discountValue.toString()
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate
    }
    if (validatedData.totalUsageLimit !== undefined) {
      updateData.totalUsageLimit = validatedData.totalUsageLimit
    }
    if (validatedData.usagePerCustomerLimit !== undefined) {
      updateData.usagePerCustomerLimit = validatedData.usagePerCustomerLimit
    }
    if (validatedData.minimumOrderValue !== undefined) {
      updateData.minimumOrderValue =
        validatedData.minimumOrderValue?.toString() || null
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive
    }

    const [updatedCoupon] = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning()

    return NextResponse.json({
      coupon: {
        id: updatedCoupon.id,
        code: updatedCoupon.code,
        title: updatedCoupon.title,
        discountType: updatedCoupon.discountType,
        discountValue: parseFloat(updatedCoupon.discountValue),
        startDate: updatedCoupon.startDate,
        endDate: updatedCoupon.endDate,
        totalUsageLimit: updatedCoupon.totalUsageLimit,
        usagePerCustomerLimit: updatedCoupon.usagePerCustomerLimit,
        isActive: updatedCoupon.isActive,
        minimumOrderValue: updatedCoupon.minimumOrderValue
          ? parseFloat(updatedCoupon.minimumOrderValue)
          : null,
      },
    })
  } catch (error) {
    console.error('Error updating coupon:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/coupons/[id]
 * Delete a coupon
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

    // Verify coupon belongs to company
    const existingCoupon = await db.query.coupons.findFirst({
      where: and(eq(coupons.id, id), eq(coupons.companyId, context.companyId)),
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    await db.delete(coupons).where(eq(coupons.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
