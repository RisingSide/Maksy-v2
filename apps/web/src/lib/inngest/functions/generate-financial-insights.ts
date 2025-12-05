/**
 * Generate Financial Insights - Inngest Job
 *
 * Runs daily at 6am to generate AI-powered financial insights
 * for all Scale tier companies
 */

import { inngest } from '../client'
import { db } from '@/db/index.server'
import { companies, subscriptions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { FinancialAIService } from '@/lib/services/financial-ai'

export const generateFinancialInsights = inngest.createFunction(
  {
    id: 'generate-financial-insights',
    name: 'Generate Financial Insights',
  },
  { cron: '0 6 * * *' }, // Daily at 6am UTC
  async ({ event, step }) => {
    // Get all companies with Scale plan using a proper join query
    // First, get subscriptions that are scale and active, then map to companies
    const scaleSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.planType, 'scale'),
        eq(subscriptions.status, 'active')
      ),
      columns: {
        companyId: true,
      },
    })

    // Get company details for each subscription
    const scaleCompanyIds = scaleSubscriptions.map((s) => s.companyId)

    const scaleCompanies =
      scaleCompanyIds.length > 0
        ? await db.query.companies.findMany({
            where: (companies, { inArray }) =>
              inArray(companies.id, scaleCompanyIds),
            columns: {
              id: true,
              companyName: true,
            },
          })
        : []

    console.log(`Found ${scaleCompanies.length} Scale tier companies`)

    // Generate insights for each company
    const results = await Promise.allSettled(
      scaleCompanies.map(async (company) => {
        try {
          const service = new FinancialAIService(company.id)
          const insights = await service.generateAllInsights()

          // Check for critical insights that need email notification
          const criticalInsights = insights.filter(
            (i) => i.priority === 'critical'
          )

          if (criticalInsights.length > 0) {
            // TODO: Send email notification
            console.log(
              `Company ${company.companyName} has ${criticalInsights.length} critical insights`
            )
          }

          return {
            companyId: company.id,
            companyName: company.companyName,
            insightsGenerated: insights.length,
            criticalAlerts: criticalInsights.length,
          }
        } catch (err) {
          console.error(
            `Failed to generate insights for company ${company.id}:`,
            err
          )
          throw err
        }
      })
    )

    // Summarize results
    const successful = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')

    const summary = {
      totalCompanies: scaleCompanies.length,
      successful: successful.length,
      failed: failed.length,
      results: successful.map((r) => (r as PromiseFulfilledResult<any>).value),
    }

    console.log('Financial insights generation complete:', summary)

    return summary
  }
)
