import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { coupons } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'

const couponSchema = z.object({
  code: z.string().min(1).max(50),
  title: z.string().max(100).nullable().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  totalUsageLimit: z.number().int().positive().nullable().optional(),
  usagePerCustomerLimit: z.number().int().positive().nullable().optional(),
  minimumOrderValue: z.number().positive().nullable().optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/coupons
 * List all coupons for the company
 */
export async function GET() {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyCoupons = await db
      .select()
      .from(coupons)
      .where(eq(coupons.companyId, context.companyId))
      .orderBy(desc(coupons.createdAt))

    return NextResponse.json({
      coupons: companyCoupons.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        discountType: c.discountType,
        discountValue: parseFloat(c.discountValue),
        startDate: c.startDate,
        endDate: c.endDate,
        totalUsageLimit: c.totalUsageLimit,
        usagePerCustomerLimit: c.usagePerCustomerLimit,
        isActive: c.isActive,
        minimumOrderValue: c.minimumOrderValue
          ? parseFloat(c.minimumOrderValue)
          : null,
        createdAt: c.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/coupons
 * Create a new coupon
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check plan access (Pro+ only)
    if (context.planType !== 'pro' && context.planType !== 'scale') {
      return NextResponse.json(
        { error: 'Coupons require Pro or Scale plan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = couponSchema.parse(body)

    // Check if code already exists for this company
    const existingCoupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.companyId, context.companyId),
        eq(coupons.code, validatedData.code.toUpperCase())
      ),
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 400 }
      )
    }

    // Create coupon
    const [coupon] = await db
      .insert(coupons)
      .values({
        companyId: context.companyId,
        code: validatedData.code.toUpperCase(),
        title: validatedData.title || null,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue.toString(),
        startDate: validatedData.startDate || null,
        endDate: validatedData.endDate || null,
        totalUsageLimit: validatedData.totalUsageLimit || null,
        usagePerCustomerLimit: validatedData.usagePerCustomerLimit || null,
        minimumOrderValue: validatedData.minimumOrderValue?.toString() || null,
        isActive: validatedData.isActive ?? true,
      })
      .returning()

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
    console.error('Error creating coupon:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}
