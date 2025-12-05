/**
 * AI Contract Generation API
 *
 * POST /api/contracts/ai-generate - Generate contract from project details
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import {
  ContractAIService,
  type ContractGenerationParams,
} from '@/lib/services/contract-ai'
import { getFeatureAccess } from '@/lib/feature-gates'

export async function POST(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context

    // Check if user has access to AI contract builder (Scale tier only)
    if (!getFeatureAccess(planType, 'aiContractBuilder')) {
      return NextResponse.json(
        { error: 'AI Contract Builder is only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: ContractGenerationParams = await request.json()

    // Validate required fields
    if (!body.projectType || !body.projectSize || !body.location) {
      return NextResponse.json(
        {
          error: 'Missing required fields: projectType, projectSize, location',
        },
        { status: 400 }
      )
    }

    // Validate project size
    if (!['small', 'medium', 'large'].includes(body.projectSize)) {
      return NextResponse.json(
        { error: 'Invalid project size. Must be small, medium, or large' },
        { status: 400 }
      )
    }

    // Generate contract
    const service = new ContractAIService(companyId)
    const generatedContract = await service.generateContract(body)

    return NextResponse.json({
      contract: generatedContract,
      message: 'Contract generated successfully',
    })
  } catch (error) {
    console.error('Error generating contract:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
