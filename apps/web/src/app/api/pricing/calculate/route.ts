/**
 * Pricing Calculation API
 *
 * POST /api/pricing/calculate - Get AI price suggestion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import {
  PricingEngine,
  type PriceCalculationParams,
} from '@/lib/services/pricing-engine'
import { getFeatureAccess } from '@/lib/feature-gates'

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
        { error: 'Dynamic AI Pricing is only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: PriceCalculationParams = await request.json()

    // Validate required fields
    if (
      !body.serviceId ||
      !body.customerId ||
      !body.location ||
      !body.estimatedHours
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: serviceId, customerId, location, estimatedHours',
        },
        { status: 400 }
      )
    }

    // Calculate price
    const engine = new PricingEngine(companyId)
    const suggestion = await engine.calculatePrice(body)

    return NextResponse.json({
      suggestion,
      message: 'Price calculated successfully',
    })
  } catch (error) {
    console.error('Error calculating price:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
