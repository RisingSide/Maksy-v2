/**
 * Pricing Rule API (Individual)
 *
 * GET /api/pricing/rules/[id] - Get a specific pricing rule
 * PATCH /api/pricing/rules/[id] - Update a pricing rule
 * DELETE /api/pricing/rules/[id] - Delete a pricing rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { getFeatureAccess } from '@/lib/feature-gates'
import { db } from '@/db/index.server'
import { pricingRules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

interface AdjustmentData {
  type?: 'percentage' | 'fixed'
  value?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context
    const { id } = await params

    if (!getFeatureAccess(planType, 'dynamicPricing')) {
      return NextResponse.json(
        { error: 'Dynamic pricing rules are only available on the Scale plan' },
        { status: 403 }
      )
    }

    const rule = await db.query.pricingRules.findFirst({
      where: and(
        eq(pricingRules.id, id),
        eq(pricingRules.companyId, companyId)
      ),
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Transform response to match frontend interface
    const adjustment = rule.adjustment as AdjustmentData | null
    const transformedRule = {
      id: rule.id,
      companyId: rule.companyId,
      name: rule.name,
      factor: rule.ruleType,
      adjustmentType: adjustment?.type || 'percentage',
      adjustment: adjustment?.value || 0,
      conditions: rule.conditions || [],
      isActive: rule.isActive,
      priority: rule.priority,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }

    return NextResponse.json({ rule: transformedRule })
  } catch (error) {
    console.error('Error fetching pricing rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context
    const { id } = await params

    if (!getFeatureAccess(planType, 'dynamicPricing')) {
      return NextResponse.json(
        { error: 'Dynamic pricing rules are only available on the Scale plan' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.factor !== undefined) updateData.ruleType = body.factor
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.conditions !== undefined) updateData.conditions = body.conditions

    if (body.adjustmentType !== undefined || body.adjustment !== undefined) {
      // Get existing rule to merge adjustment
      const existingRule = await db.query.pricingRules.findFirst({
        where: and(
          eq(pricingRules.id, id),
          eq(pricingRules.companyId, companyId)
        ),
      })

      if (existingRule) {
        const existingAdjustment =
          existingRule.adjustment as AdjustmentData | null
        updateData.adjustment = {
          type: body.adjustmentType ?? existingAdjustment?.type ?? 'percentage',
          value: body.adjustment ?? existingAdjustment?.value ?? 0,
        }
      }
    }

    updateData.updatedAt = new Date()

    const [updatedRule] = await db
      .update(pricingRules)
      .set(updateData)
      .where(
        and(eq(pricingRules.id, id), eq(pricingRules.companyId, companyId))
      )
      .returning()

    if (!updatedRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Transform response to match frontend interface
    const updatedAdjustment = updatedRule.adjustment as AdjustmentData | null
    const transformedRule = {
      id: updatedRule.id,
      companyId: updatedRule.companyId,
      name: updatedRule.name,
      factor: updatedRule.ruleType,
      adjustmentType: updatedAdjustment?.type || 'percentage',
      adjustment: updatedAdjustment?.value || 0,
      conditions: updatedRule.conditions || [],
      isActive: updatedRule.isActive,
      priority: updatedRule.priority,
      createdAt: updatedRule.createdAt,
      updatedAt: updatedRule.updatedAt,
    }

    return NextResponse.json({
      rule: transformedRule,
      message: 'Pricing rule updated successfully',
    })
  } catch (error) {
    console.error('Error updating pricing rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context
    const { id } = await params

    if (!getFeatureAccess(planType, 'dynamicPricing')) {
      return NextResponse.json(
        { error: 'Dynamic pricing rules are only available on the Scale plan' },
        { status: 403 }
      )
    }

    const [deletedRule] = await db
      .delete(pricingRules)
      .where(
        and(eq(pricingRules.id, id), eq(pricingRules.companyId, companyId))
      )
      .returning()

    if (!deletedRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Pricing rule deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting pricing rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
