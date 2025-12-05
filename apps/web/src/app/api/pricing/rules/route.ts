/**
 * Pricing Rules API
 *
 * GET /api/pricing/rules - List pricing rules
 * POST /api/pricing/rules - Create pricing rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { getFeatureAccess } from '@/lib/feature-gates'
import { db } from '@/db/index.server'
import { pricingRules } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

interface AdjustmentData {
  type?: 'percentage' | 'fixed'
  value?: number
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context

    // Check if user has access to dynamic pricing (Scale tier only)
    if (!getFeatureAccess(planType, 'dynamicPricing')) {
      return NextResponse.json(
        { error: 'Dynamic pricing rules are only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Fetch pricing rules using Drizzle
    const rules = await db.query.pricingRules.findMany({
      where: eq(pricingRules.companyId, companyId),
      orderBy: [desc(pricingRules.priority)],
    })

    // Transform rules to match frontend interface
    const transformedRules = rules.map((rule) => {
      const ruleAdjustment = rule.adjustment as AdjustmentData | null
      return {
        id: rule.id,
        companyId: rule.companyId,
        name: rule.name,
        factor: rule.ruleType, // Map ruleType to factor
        adjustmentType: ruleAdjustment?.type || 'percentage',
        adjustment: ruleAdjustment?.value || 0,
        conditions: rule.conditions || [],
        isActive: rule.isActive,
        priority: rule.priority,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      }
    })

    return NextResponse.json({
      rules: transformedRules,
      total: transformedRules.length,
    })
  } catch (error) {
    console.error('Error fetching pricing rules:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context

    // Check if user has access to dynamic pricing (Scale tier only)
    if (!getFeatureAccess(planType, 'dynamicPricing')) {
      return NextResponse.json(
        { error: 'Dynamic pricing rules are only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.factor) {
      return NextResponse.json(
        { error: 'Missing required fields: name, factor' },
        { status: 400 }
      )
    }

    // Create pricing rule using Drizzle
    const [rule] = await db
      .insert(pricingRules)
      .values({
        companyId: companyId,
        name: body.name,
        ruleType: body.factor, // Map factor to ruleType
        conditions: body.conditions || [],
        adjustment: {
          type: body.adjustmentType || 'percentage',
          value: body.adjustment || 0,
        },
        isActive: body.isActive ?? true,
        priority: body.priority ?? 1,
      })
      .returning()

    // Transform response to match frontend interface
    const ruleAdjustment = rule.adjustment as AdjustmentData | null
    const transformedRule = {
      id: rule.id,
      companyId: rule.companyId,
      name: rule.name,
      factor: rule.ruleType,
      adjustmentType: ruleAdjustment?.type || 'percentage',
      adjustment: ruleAdjustment?.value || 0,
      conditions: rule.conditions || [],
      isActive: rule.isActive,
      priority: rule.priority,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }

    return NextResponse.json({
      rule: transformedRule,
      message: 'Pricing rule created successfully',
    })
  } catch (error) {
    console.error('Error creating pricing rule:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
