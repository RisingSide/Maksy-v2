import { NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { coupons, couponUsages, couponServiceRestrictions } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(1),
  companyId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  orderTotal: z.number().positive(),
})

/**
 * POST /api/coupons/validate
 * Validate a coupon code (can be called from public booking page)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = validateSchema.parse(body)

    // Find the coupon
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.companyId, validatedData.companyId),
        eq(coupons.code, validatedData.code.toUpperCase()),
        eq(coupons.isActive, true)
      ),
    })

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Invalid coupon code' },
        { status: 400 }
      )
    }

    // Check if coupon has started
    if (coupon.startDate) {
      const startDate = new Date(coupon.startDate)
      if (startDate > new Date()) {
        return NextResponse.json(
          { valid: false, error: 'This coupon is not yet active' },
          { status: 400 }
        )
      }
    }

    // Check if coupon has expired
    if (coupon.endDate) {
      const endDate = new Date(coupon.endDate)
      endDate.setHours(23, 59, 59, 999) // End of day
      if (endDate < new Date()) {
        return NextResponse.json(
          { valid: false, error: 'This coupon has expired' },
          { status: 400 }
        )
      }
    }

    // Check total usage limit - count from couponUsages table
    if (coupon.totalUsageLimit) {
      const totalUsage = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsages)
        .where(eq(couponUsages.couponId, coupon.id))

      if (totalUsage[0]?.count >= coupon.totalUsageLimit) {
        return NextResponse.json(
          { valid: false, error: 'This coupon has reached its usage limit' },
          { status: 400 }
        )
      }
    }

    // Check per-customer usage limit
    if (validatedData.customerId && coupon.usagePerCustomerLimit) {
      const customerUsage = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsages)
        .where(
          and(
            eq(couponUsages.couponId, coupon.id),
            eq(couponUsages.customerId, validatedData.customerId)
          )
        )

      if (customerUsage[0]?.count >= coupon.usagePerCustomerLimit) {
        return NextResponse.json(
          {
            valid: false,
            error:
              'You have already used this coupon the maximum number of times',
          },
          { status: 400 }
        )
      }
    }

    // Check minimum order value
    if (coupon.minimumOrderValue) {
      const minValue = parseFloat(coupon.minimumOrderValue)
      if (validatedData.orderTotal < minValue) {
        return NextResponse.json(
          {
            valid: false,
            error: `Minimum order of $${minValue.toFixed(2)} required for this coupon`,
          },
          { status: 400 }
        )
      }
    }

    // Check applicable services using couponServiceRestrictions table
    const serviceRestrictions = await db
      .select({ serviceId: couponServiceRestrictions.serviceId })
      .from(couponServiceRestrictions)
      .where(eq(couponServiceRestrictions.couponId, coupon.id))

    if (serviceRestrictions.length > 0) {
      if (!validatedData.serviceIds || validatedData.serviceIds.length === 0) {
        return NextResponse.json(
          {
            valid: false,
            error: 'This coupon is only valid for specific services',
          },
          { status: 400 }
        )
      }

      const applicableServiceIds = serviceRestrictions.map((r) => r.serviceId)
      const hasApplicableService = validatedData.serviceIds.some((id) =>
        applicableServiceIds.includes(id)
      )

      if (!hasApplicableService) {
        return NextResponse.json(
          {
            valid: false,
            error: 'This coupon is not valid for the selected services',
          },
          { status: 400 }
        )
      }
    }

    // Calculate discount
    const discountValue = parseFloat(coupon.discountValue)
    let discountAmount: number

    if (coupon.discountType === 'percentage') {
      discountAmount = (validatedData.orderTotal * discountValue) / 100
    } else {
      discountAmount = Math.min(discountValue, validatedData.orderTotal)
    }

    const finalTotal = Math.max(0, validatedData.orderTotal - discountAmount)

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: discountValue,
      },
      discount: {
        amount: discountAmount,
        originalTotal: validatedData.orderTotal,
        finalTotal: finalTotal,
      },
    })
  } catch (error) {
    console.error('Error validating coupon:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { valid: false, error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
