/**
 * Financial Insights API
 *
 * GET /api/financial/insights - List insights for company
 * POST /api/financial/insights - Generate new insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { financialInsights } from '@/db/schema'
import { eq, and, desc, or, isNull, gt, count } from 'drizzle-orm'
import { FinancialAIService } from '@/lib/services/financial-ai'
import { getFeatureAccess } from '@/lib/feature-gates'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get company context
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to financial AI (Scale tier only)
    if (!getFeatureAccess(context.planType, 'financialDashboard')) {
      return NextResponse.json(
        { error: 'Financial AI Dashboard is only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unread') === 'true'
    const priority = searchParams.get('priority') // 'critical', 'high', etc.

    // Build where conditions
    const whereConditions = [
      eq(financialInsights.companyId, context.companyId),
      // Filter expired insights (expiresAt is null OR expiresAt > now)
      or(
        isNull(financialInsights.expiresAt),
        gt(financialInsights.expiresAt, new Date())
      ),
    ]

    if (unreadOnly) {
      whereConditions.push(eq(financialInsights.isRead, false))
    }

    if (priority) {
      whereConditions.push(eq(financialInsights.priority, priority))
    }

    // Build where clause
    const whereClause = and(...whereConditions)

    // Execute paginated query and count query in parallel
    const [insights, countResult] = await Promise.all([
      // Paginated data query
      db.query.financialInsights.findMany({
        where: whereClause,
        limit,
        orderBy: [desc(financialInsights.generatedAt)],
      }),
      // Total count query (without pagination)
      db.select({ count: count() }).from(financialInsights).where(whereClause),
    ])

    const total = countResult[0]?.count ?? 0

    return NextResponse.json({
      insights,
      total,
      limit,
    })
  } catch (error) {
    console.error('Error fetching financial insights:', error)

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
    // Authenticate and get company context
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to financial AI (Scale tier only)
    if (!getFeatureAccess(context.planType, 'financialDashboard')) {
      return NextResponse.json(
        { error: 'Financial AI Dashboard is only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Generate all insights
    const service = new FinancialAIService(context.companyId)
    const insights = await service.generateAllInsights()

    return NextResponse.json({
      insights,
      message: `Generated ${insights.length} financial insights`,
    })
  } catch (error) {
    console.error('Error generating financial insights:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
