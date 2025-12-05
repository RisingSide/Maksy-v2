/**
 * Financial AI Service
 *
 * Provides AI-powered financial insights for Scale tier customers:
 * - Profit margin analysis
 * - Pricing optimization suggestions
 * - Revenue forecasting
 * - Cost trend analysis
 * - Cash flow predictions
 *
 * Uses Drizzle ORM for all database queries.
 * Auth is handled by API routes that call this service.
 */

import OpenAI from 'openai'
import { db } from '@/db/index.server'
import {
  jobs,
  invoices,
  estimates,
  inventoryMovements,
  inventoryItems,
  financialInsights,
} from '@/db/schema'
import { eq, and, gte, lte, lt, desc, inArray, sql } from 'drizzle-orm'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface FinancialInsight {
  id?: string
  company_id: string
  insight_type:
    | 'margin_alert'
    | 'pricing_suggestion'
    | 'forecast'
    | 'cost_analysis'
    | 'cash_flow'
  title: string
  content: string
  data: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  generated_at?: string
  expires_at?: string
}

export class FinancialAIService {
  constructor(private companyId: string) {}

  /**
   * Analyze profit margins and explain trends
   */
  async analyzeProfitMargins(): Promise<FinancialInsight> {
    // Fetch last 90 days of invoices
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const recentInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.companyId, this.companyId),
        gte(invoices.createdAt, ninetyDaysAgo),
        eq(invoices.status, 'paid')
      ),
      columns: {
        total: true,
        createdAt: true,
      },
    })

    // Fetch previous 90 days for comparison
    const oneEightyDaysAgo = new Date()
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180)

    const previousInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.companyId, this.companyId),
        gte(invoices.createdAt, oneEightyDaysAgo),
        lt(invoices.createdAt, ninetyDaysAgo),
        eq(invoices.status, 'paid')
      ),
      columns: {
        total: true,
        createdAt: true,
      },
    })

    // Calculate revenue
    const recentRevenue = recentInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total || '0'),
      0
    )
    const previousRevenue = previousInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total || '0'),
      0
    )

    // Fetch inventory movements for cost analysis (items consumed)
    const recentMovements = await db.query.inventoryMovements.findMany({
      where: and(
        eq(inventoryMovements.companyId, this.companyId),
        eq(inventoryMovements.changeType, 'job_consumption'),
        gte(inventoryMovements.createdAt, ninetyDaysAgo)
      ),
      columns: {
        changeAmount: true,
        itemId: true,
      },
    })

    // Get unit costs for the items
    const itemIds = [...new Set(recentMovements.map((m) => m.itemId))]
    let recentCosts = 0

    if (itemIds.length > 0) {
      const items = await db.query.inventoryItems.findMany({
        where: inArray(inventoryItems.id, itemIds),
        columns: {
          id: true,
          unitCost: true,
        },
      })

      const itemCostMap = new Map(
        items.map((i) => [i.id, parseFloat(i.unitCost || '0')])
      )

      recentCosts = recentMovements.reduce((sum, mov) => {
        const unitCost = itemCostMap.get(mov.itemId) || 0
        const quantity = Math.abs(parseFloat(mov.changeAmount || '0'))
        return sum + quantity * unitCost
      }, 0)
    }

    // Calculate margins
    const recentMargin =
      recentRevenue > 0
        ? ((recentRevenue - recentCosts) / recentRevenue) * 100
        : 0
    const revenueChange =
      previousRevenue > 0
        ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
        : 0

    // Use AI to explain trends
    const prompt = `Analyze this business's financial data and provide insights:

Revenue (Last 90 days): $${recentRevenue.toFixed(2)}
Revenue (Previous 90 days): $${previousRevenue.toFixed(2)}
Revenue Change: ${revenueChange.toFixed(2)}%
Material Costs (Last 90 days): $${recentCosts.toFixed(2)}
Current Profit Margin: ${recentMargin.toFixed(2)}%

Provide a concise (2-3 sentences) explanation of:
1. What the profit margin trend means
2. Key factors driving the change
3. One actionable recommendation

Be specific and business-focused.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    })

    const aiAnalysis =
      completion.choices[0]?.message?.content || 'Unable to generate analysis.'

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    if (recentMargin < 20) priority = 'critical'
    else if (recentMargin < 30) priority = 'high'
    else if (revenueChange < -10) priority = 'high'

    const title =
      recentMargin < 30
        ? `⚠️ Profit Margin Alert: ${recentMargin.toFixed(1)}%`
        : `Profit Margin: ${recentMargin.toFixed(1)}%`

    return {
      company_id: this.companyId,
      insight_type: 'margin_alert',
      title,
      content: aiAnalysis,
      data: {
        recent_revenue: recentRevenue,
        previous_revenue: previousRevenue,
        revenue_change_pct: revenueChange,
        recent_costs: recentCosts,
        profit_margin_pct: recentMargin,
      },
      priority,
    }
  }

  /**
   * Generate pricing optimization suggestions
   */
  async suggestPricingChanges(): Promise<FinancialInsight> {
    // Analyze pricing vs conversion rate
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const recentEstimates = await db.query.estimates.findMany({
      where: and(
        eq(estimates.companyId, this.companyId),
        gte(estimates.createdAt, ninetyDaysAgo)
      ),
      columns: {
        total: true,
        status: true,
        createdAt: true,
      },
    })

    const total = recentEstimates.length
    const approved = recentEstimates.filter(
      (e) => e.status === 'approved'
    ).length
    const conversionRate = total > 0 ? (approved / total) * 100 : 0

    const avgEstimate =
      recentEstimates.reduce((sum, e) => sum + parseFloat(e.total || '0'), 0) /
      (total || 1)

    const prompt = `As a pricing consultant, analyze this data:

Total Estimates (90 days): ${total}
Approved Estimates: ${approved}
Conversion Rate: ${conversionRate.toFixed(1)}%
Average Estimate Value: $${avgEstimate.toFixed(2)}

Based on this conversion rate, suggest:
1. Whether they should raise or lower prices
2. By approximately what percentage
3. Expected impact on both conversion and revenue

Be specific with numbers. Keep response under 150 words.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    })

    const suggestion =
      completion.choices[0]?.message?.content ||
      'Insufficient data for pricing suggestions.'

    return {
      company_id: this.companyId,
      insight_type: 'pricing_suggestion',
      title: 'Pricing Optimization Opportunity',
      content: suggestion,
      data: {
        conversion_rate: conversionRate,
        avg_estimate: avgEstimate,
        total_estimates: total,
        approved_estimates: approved,
      },
      priority: conversionRate < 30 ? 'high' : 'medium',
    }
  }

  /**
   * Forecast revenue for next quarter
   */
  async forecastRevenue(): Promise<FinancialInsight> {
    // Get 6 months of historical revenue
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const paidInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.companyId, this.companyId),
        eq(invoices.status, 'paid'),
        gte(invoices.createdAt, sixMonthsAgo)
      ),
      columns: {
        total: true,
        createdAt: true,
      },
      orderBy: [invoices.createdAt],
    })

    // Group by month
    const monthlyRevenue: Record<string, number> = {}
    paidInvoices.forEach((inv) => {
      const month = inv.createdAt.toISOString().substring(0, 7) // YYYY-MM
      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + parseFloat(inv.total || '0')
    })

    const revenues = Object.values(monthlyRevenue)
    const avgMonthly =
      revenues.reduce((a, b) => a + b, 0) / (revenues.length || 1)

    // Simple trend analysis
    const recentAvg =
      revenues.length >= 3
        ? revenues.slice(-3).reduce((a, b) => a + b, 0) / 3
        : avgMonthly
    const growth =
      revenues.length >= 3 ? ((recentAvg - avgMonthly) / avgMonthly) * 100 : 0

    const prompt = `Analyze this revenue trend and forecast next quarter:

Monthly Revenue History: ${revenues.map((r) => `$${r.toFixed(0)}`).join(', ') || 'No data'}
Average Monthly: $${avgMonthly.toFixed(2)}
Recent 3-Month Average: $${recentAvg.toFixed(2)}
Growth Trend: ${growth.toFixed(1)}%

Provide:
1. Next quarter revenue forecast (3 months)
2. Confidence level in the forecast
3. Key assumptions

Keep under 150 words.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    })

    const forecast =
      completion.choices[0]?.message?.content ||
      'Insufficient data for forecasting.'

    // Calculate projected quarterly revenue
    const projectedQuarterly = recentAvg * 3 * (1 + growth / 100)

    return {
      company_id: this.companyId,
      insight_type: 'forecast',
      title: `Q${Math.ceil((new Date().getMonth() + 1) / 3) + 1} Revenue Forecast: $${projectedQuarterly.toFixed(0)}`,
      content: forecast,
      data: {
        monthly_revenue: monthlyRevenue,
        avg_monthly: avgMonthly,
        recent_avg: recentAvg,
        growth_pct: growth,
        projected_quarterly: projectedQuarterly,
      },
      priority: 'medium',
    }
  }

  /**
   * Analyze cost trends
   */
  async analyzeCosts(): Promise<FinancialInsight> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Get recent inventory movements with item details
    const recentMovements = await db.query.inventoryMovements.findMany({
      where: and(
        eq(inventoryMovements.companyId, this.companyId),
        eq(inventoryMovements.changeType, 'job_consumption'),
        gte(inventoryMovements.createdAt, thirtyDaysAgo)
      ),
      columns: {
        changeAmount: true,
        itemId: true,
      },
    })

    const previousMovements = await db.query.inventoryMovements.findMany({
      where: and(
        eq(inventoryMovements.companyId, this.companyId),
        eq(inventoryMovements.changeType, 'job_consumption'),
        gte(inventoryMovements.createdAt, sixtyDaysAgo),
        lt(inventoryMovements.createdAt, thirtyDaysAgo)
      ),
      columns: {
        changeAmount: true,
        itemId: true,
      },
    })

    // Get all item IDs and their details
    const allItemIds = [
      ...new Set([
        ...recentMovements.map((m) => m.itemId),
        ...previousMovements.map((m) => m.itemId),
      ]),
    ]

    let recentTotal = 0
    let previousTotal = 0
    const categoryTotals: Record<string, number> = {}

    if (allItemIds.length > 0) {
      const items = await db.query.inventoryItems.findMany({
        where: inArray(inventoryItems.id, allItemIds),
        columns: {
          id: true,
          unitCost: true,
          category: true,
        },
      })

      const itemMap = new Map(
        items.map((i) => [
          i.id,
          {
            cost: parseFloat(i.unitCost || '0'),
            category: i.category || 'Other',
          },
        ])
      )

      // Calculate recent costs
      recentMovements.forEach((m) => {
        const item = itemMap.get(m.itemId)
        if (item) {
          const cost = Math.abs(parseFloat(m.changeAmount || '0')) * item.cost
          recentTotal += cost
          categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) + cost
        }
      })

      // Calculate previous costs
      previousMovements.forEach((m) => {
        const item = itemMap.get(m.itemId)
        if (item) {
          previousTotal +=
            Math.abs(parseFloat(m.changeAmount || '0')) * item.cost
        }
      })
    }

    const costChange =
      previousTotal > 0
        ? ((recentTotal - previousTotal) / previousTotal) * 100
        : 0

    // Find top cost categories
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, cost]) => `${cat}: $${cost.toFixed(2)}`)
      .join(', ')

    const prompt = `Analyze these material cost trends:

Recent Costs (30 days): $${recentTotal.toFixed(2)}
Previous Costs (30 days): $${previousTotal.toFixed(2)}
Change: ${costChange.toFixed(1)}%
Top Categories: ${topCategories || 'No data'}

Explain:
1. What's driving the cost change
2. Whether this is concerning
3. One cost-reduction strategy

Keep under 150 words.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    })

    const analysis =
      completion.choices[0]?.message?.content || 'Insufficient cost data.'

    return {
      company_id: this.companyId,
      insight_type: 'cost_analysis',
      title:
        costChange > 15
          ? `⚠️ Material Costs Up ${costChange.toFixed(1)}%`
          : 'Cost Trend Analysis',
      content: analysis,
      data: {
        recent_costs: recentTotal,
        previous_costs: previousTotal,
        cost_change_pct: costChange,
        category_breakdown: categoryTotals,
      },
      priority: costChange > 20 ? 'high' : costChange > 10 ? 'medium' : 'low',
    }
  }

  /**
   * Predict cash flow
   */
  async predictCashFlow(): Promise<FinancialInsight> {
    // Outstanding invoices
    const unpaidInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.companyId, this.companyId),
        inArray(invoices.status, ['unpaid', 'partially_paid', 'overdue'])
      ),
      columns: {
        total: true,
        dueDate: true,
      },
    })

    const outstandingTotal = unpaidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total || '0'),
      0
    )

    // Scheduled jobs (future revenue)
    // Note: scheduledDate is a date string (YYYY-MM-DD), not a timestamp
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const upcomingJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.companyId, this.companyId),
        inArray(jobs.status, ['scheduled', 'confirmed']),
        gte(jobs.scheduledDate, today),
        lte(jobs.scheduledDate, thirtyDaysOut)
      ),
      columns: {
        totalPrice: true,
        scheduledDate: true,
      },
    })

    const projectedRevenue = upcomingJobs.reduce(
      (sum, job) => sum + parseFloat(job.totalPrice || '0'),
      0
    )

    const totalProjected = outstandingTotal + projectedRevenue

    const prompt = `Analyze this 30-day cash flow projection:

Outstanding Invoices: $${outstandingTotal.toFixed(2)}
Projected Revenue (Upcoming Jobs): $${projectedRevenue.toFixed(2)}
Total Projected Inflow: $${totalProjected.toFixed(2)}

Provide:
1. Cash flow health assessment
2. Any risks or concerns
3. One recommendation

Keep under 150 words.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    })

    const prediction =
      completion.choices[0]?.message?.content ||
      'Insufficient data for cash flow prediction.'

    return {
      company_id: this.companyId,
      insight_type: 'cash_flow',
      title: `30-Day Cash Flow: $${totalProjected.toFixed(0)}`,
      content: prediction,
      data: {
        outstanding_invoices: outstandingTotal,
        projected_job_revenue: projectedRevenue,
        total_projected: totalProjected,
        unpaid_invoice_count: unpaidInvoices.length,
        upcoming_job_count: upcomingJobs.length,
      },
      priority: outstandingTotal < 1000 ? 'high' : 'medium',
    }
  }

  /**
   * Store insight in database
   */
  async storeInsight(insight: FinancialInsight): Promise<string> {
    // Set expiration (insights expire after 30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const [insertedInsight] = await db
      .insert(financialInsights)
      .values({
        companyId: this.companyId,
        insightType: insight.insight_type,
        title: insight.title,
        content: insight.content,
        data: insight.data,
        priority: insight.priority,
        expiresAt: expiresAt,
        isRead: false,
      })
      .returning()

    if (!insertedInsight) {
      throw new Error('Failed to store insight')
    }

    return insertedInsight.id
  }

  /**
   * Generate all insights for a company (with error handling for each)
   */
  async generateAllInsights(): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []
    const errors: string[] = []

    // Run each insight generation with error handling
    const generators = [
      { name: 'Profit Margins', fn: () => this.analyzeProfitMargins() },
      { name: 'Pricing Suggestions', fn: () => this.suggestPricingChanges() },
      { name: 'Revenue Forecast', fn: () => this.forecastRevenue() },
      { name: 'Cost Analysis', fn: () => this.analyzeCosts() },
      { name: 'Cash Flow', fn: () => this.predictCashFlow() },
    ]

    for (const generator of generators) {
      try {
        const insight = await generator.fn()
        insights.push(insight)
      } catch (error) {
        console.error(`Failed to generate ${generator.name} insight:`, error)
        errors.push(generator.name)
      }
    }

    // Store all successful insights
    await Promise.all(insights.map((insight) => this.storeInsight(insight)))

    if (errors.length > 0) {
      console.warn(`Failed to generate insights for: ${errors.join(', ')}`)
    }

    return insights
  }
}
