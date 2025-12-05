/**
 * Financial Analysis API
 *
 * POST /api/financial/analysis - Run specific analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { FinancialAIService } from '@/lib/services/financial-ai'
import { getFeatureAccess } from '@/lib/feature-gates'

export async function POST(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context

    // Check if user has access to financial AI (Scale tier only)
    if (!getFeatureAccess(planType, 'financialDashboard')) {
      return NextResponse.json(
        { error: 'Financial AI Dashboard is only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Get analysis type from request body
    const body = await request.json()
    const { type } = body

    const service = new FinancialAIService(companyId)

    let result
    switch (type) {
      case 'profit_margins':
        result = await service.analyzeProfitMargins()
        break
      case 'pricing':
        result = await service.suggestPricingChanges()
        break
      case 'forecast':
        result = await service.forecastRevenue()
        break
      case 'costs':
        result = await service.analyzeCosts()
        break
      case 'cash_flow':
        result = await service.predictCashFlow()
        break
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        )
    }

    // Store the insight
    await service.storeInsight(result)

    return NextResponse.json({
      analysis: result,
    })
  } catch (error) {
    console.error('Error running financial analysis:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
