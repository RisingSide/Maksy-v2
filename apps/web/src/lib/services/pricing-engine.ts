/**
 * Dynamic AI Pricing Engine
 *
 * Calculates optimal pricing based on multiple factors:
 * - Base service price
 * - Material costs (from inventory)
 * - Labor (hours × rate)
 * - Location (distance, cost of living)
 * - Demand (schedule availability)
 * - Customer history (repeat discounts)
 * - Job difficulty
 * - Seasonality
 * - Urgency (rush premiums)
 * - Company pricing rules
 *
 * NOTE: This service uses Drizzle ORM for database queries.
 * Auth is handled by API routes that call this service.
 * Full Drizzle query migration needed in Phase 1.
 */

import { db } from '@/db/index.server'
import {
  services,
  inventoryItems,
  companySettings,
  jobs,
  pricingRules,
  pricingHistory,
} from '@/db/schema'
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm'

export interface PriceCalculationParams {
  serviceId: string
  customerId: string
  location: string // Customer address
  materials?: Array<{
    inventoryItemId: string
    quantity: number
  }>
  estimatedHours: number
  urgency: 'normal' | 'rush'
  scheduledDate?: Date
}

export interface PriceSuggestion {
  basePrice: number
  breakdown: PriceBreakdown
  suggestedPrice: number
  confidence: 'low' | 'medium' | 'high'
  explanation: string
}

export interface PriceBreakdown {
  serviceBase: number
  materials: number
  labor: number
  locationAdjustment: number
  demandAdjustment: number
  customerDiscount: number
  difficultyMultiplier: number
  seasonalAdjustment: number
  urgencyPremium: number
  rulesAdjustment: number
}

export interface PricingContext {
  customerId: string
  serviceId: string
  scheduledDate: Date
  location: string
}

export interface AdjustedPrice {
  originalPrice: number
  adjustedPrice: number
  rulesApplied: Array<{
    ruleName: string
    adjustment: number
    reason: string
  }>
}

export class PricingEngine {
  constructor(private companyId: string) {}

  /**
   * Calculate optimized price suggestion
   */
  async calculatePrice(
    params: PriceCalculationParams
  ): Promise<PriceSuggestion> {
    // Factor 1: Base service price using Drizzle
    const service = await db.query.services.findFirst({
      where: eq(services.id, params.serviceId),
      columns: {
        price: true,
        name: true,
        durationMinutes: true,
      },
    })

    const baseServicePrice = parseFloat(service?.price?.toString() || '0')

    // Factor 2: Material costs
    let materialsCost = 0
    if (params.materials && params.materials.length > 0) {
      const materialIds = params.materials.map((m) => m.inventoryItemId)
      const inventory = await db.query.inventoryItems.findMany({
        where: inArray(inventoryItems.id, materialIds),
        columns: {
          id: true,
          unitCost: true,
        },
      })

      materialsCost = inventory.reduce((total, item) => {
        const material = params.materials!.find(
          (m) => m.inventoryItemId === item.id
        )
        return (
          total +
          parseFloat(item.unitCost?.toString() || '0') *
            (material?.quantity || 0)
        )
      }, 0)
    }

    // Factor 3: Labor costs using Drizzle
    // Note: hourlyLaborRate doesn't exist in companySettings schema - using default
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, this.companyId),
      columns: {
        id: true, // Just to verify company exists
      },
    })

    const laborRate = 75 // Default labor rate - TODO: add hourlyLaborRate to companySettings schema in Phase 1
    const laborCost = params.estimatedHours * laborRate

    // Factor 4: Location premium (distance from base)
    const locationAdjustment = await this.calculateLocationPremium(
      params.location
    )

    // Factor 5: Demand adjustment (schedule availability)
    const demandAdjustment = params.scheduledDate
      ? await this.calculateDemandAdjustment(params.scheduledDate)
      : 0

    // Factor 6: Customer history discount
    const customerDiscount = await this.calculateCustomerDiscount(
      params.customerId
    )

    // Factor 7: Difficulty multiplier (based on service type)
    const difficultyMultiplier = 1.0 // TODO: Implement based on service complexity

    // Factor 8: Seasonal adjustment
    const seasonalAdjustment = this.calculateSeasonalAdjustment(
      params.scheduledDate || new Date()
    )

    // Factor 9: Urgency premium
    const urgencyPremium = params.urgency === 'rush' ? 0.25 : 0 // 25% rush premium

    // Calculate base price
    let calculatedPrice = baseServicePrice + materialsCost + laborCost

    // Apply adjustments
    calculatedPrice += locationAdjustment
    calculatedPrice += calculatedPrice * demandAdjustment
    calculatedPrice -= customerDiscount
    calculatedPrice *= difficultyMultiplier
    calculatedPrice += seasonalAdjustment
    calculatedPrice += calculatedPrice * urgencyPremium

    // Factor 10: Apply company pricing rules
    const { adjustedPrice, rulesApplied } = await this.applyDynamicRules(
      calculatedPrice,
      {
        customerId: params.customerId,
        serviceId: params.serviceId,
        scheduledDate: params.scheduledDate || new Date(),
        location: params.location,
      }
    )

    const rulesAdjustment = adjustedPrice - calculatedPrice
    const finalPrice = adjustedPrice

    // Generate explanation
    const explanation = this.generateExplanation({
      baseServicePrice,
      materialsCost,
      laborCost,
      locationAdjustment,
      demandAdjustment: calculatedPrice * demandAdjustment,
      customerDiscount,
      urgencyPremium: calculatedPrice * urgencyPremium,
      rulesApplied,
    })

    // Determine confidence based on data completeness
    const confidence = this.calculateConfidence(params)

    return {
      basePrice: baseServicePrice + materialsCost + laborCost,
      breakdown: {
        serviceBase: baseServicePrice,
        materials: materialsCost,
        labor: laborCost,
        locationAdjustment,
        demandAdjustment: calculatedPrice * demandAdjustment,
        customerDiscount,
        difficultyMultiplier,
        seasonalAdjustment,
        urgencyPremium: calculatedPrice * urgencyPremium,
        rulesAdjustment,
      },
      suggestedPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimals
      confidence,
      explanation,
    }
  }

  /**
   * Calculate location premium based on distance
   */
  private async calculateLocationPremium(location: string): Promise<number> {
    // TODO: Implement actual distance calculation using Google Maps API
    // For now, return a simple estimate
    return 0 // No location premium for now
  }

  /**
   * Calculate demand adjustment based on schedule availability
   */
  private async calculateDemandAdjustment(
    scheduledDate: Date
  ): Promise<number> {
    // Check how many jobs are scheduled that day using Drizzle
    const startOfDay = new Date(scheduledDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(scheduledDate)
    endOfDay.setHours(23, 59, 59, 999)

    const jobList = await db.query.jobs.findMany({
      where: and(
        eq(jobs.companyId, this.companyId),
        gte(jobs.scheduledDate, startOfDay.toISOString()),
        lte(jobs.scheduledDate, endOfDay.toISOString())
      ),
      columns: {
        id: true,
      },
    })

    const jobCount = jobList.length

    // Apply surge pricing if heavily booked
    if (jobCount >= 8) return 0.15 // 15% surge if 8+ jobs
    if (jobCount >= 5) return 0.1 // 10% surge if 5+ jobs
    if (jobCount >= 3) return 0.05 // 5% surge if 3+ jobs

    return 0 // No surge for light days
  }

  /**
   * Calculate customer discount for repeat customers
   */
  private async calculateCustomerDiscount(customerId: string): Promise<number> {
    // Count completed jobs for this customer using Drizzle
    const completedJobsList = await db.query.jobs.findMany({
      where: and(eq(jobs.customerId, customerId), eq(jobs.status, 'completed')),
      columns: {
        id: true,
      },
    })

    const jobCount = completedJobsList.length

    // Loyalty discount tiers
    if (jobCount >= 10) return 50 // $50 off for 10+ jobs
    if (jobCount >= 5) return 25 // $25 off for 5+ jobs
    if (jobCount >= 2) return 10 // $10 off for repeat customers

    return 0 // No discount for new customers
  }

  /**
   * Calculate seasonal adjustment
   */
  private calculateSeasonalAdjustment(date: Date): number {
    const month = date.getMonth() + 1 // 1-12

    // Example: HVAC/landscaping seasonality
    // High demand: May-September (summer months)
    // Low demand: November-February (winter months)

    if (month >= 5 && month <= 9) return 25 // Summer premium
    if (month >= 11 || month <= 2) return -25 // Winter discount

    return 0 // Spring/fall normal pricing
  }

  /**
   * Apply company-specific pricing rules
   */
  async applyDynamicRules(
    basePrice: number,
    context: PricingContext
  ): Promise<AdjustedPrice> {
    // Fetch active pricing rules using Drizzle
    const rules = await db.query.pricingRules.findMany({
      where: and(
        eq(pricingRules.companyId, this.companyId),
        eq(pricingRules.isActive, true)
      ),
      orderBy: [desc(pricingRules.priority)],
    }) // Higher priority first

    if (!rules || rules.length === 0) {
      return {
        originalPrice: basePrice,
        adjustedPrice: basePrice,
        rulesApplied: [],
      }
    }

    let adjustedPrice = basePrice
    const rulesApplied: Array<{
      ruleName: string
      adjustment: number
      reason: string
    }> = []

    for (const rule of rules) {
      // Check if rule conditions are met
      const conditionsMet = this.evaluateRuleConditions(
        rule.conditions,
        context
      )

      if (conditionsMet) {
        const adjustment = rule.adjustment as { type: string; value: number }
        let adjustmentAmount = 0

        if (adjustment.type === 'percentage') {
          adjustmentAmount = (adjustedPrice * adjustment.value) / 100
        } else if (adjustment.type === 'fixed') {
          adjustmentAmount = adjustment.value
        }

        adjustedPrice += adjustmentAmount

        rulesApplied.push({
          ruleName: rule.name,
          adjustment: adjustmentAmount,
          reason: `${rule.ruleType} rule applied`,
        })
      }
    }

    return {
      originalPrice: basePrice,
      adjustedPrice,
      rulesApplied,
    }
  }

  /**
   * Evaluate if pricing rule conditions are met
   */
  private evaluateRuleConditions(
    conditions: any,
    context: PricingContext
  ): boolean {
    // Simple condition evaluation
    // In production, this would be more sophisticated

    if (conditions.day_of_week) {
      const dayOfWeek = context.scheduledDate.getDay()
      if (!conditions.day_of_week.includes(dayOfWeek)) {
        return false
      }
    }

    if (conditions.time_of_day) {
      const hour = context.scheduledDate.getHours()
      if (
        hour < conditions.time_of_day.start ||
        hour > conditions.time_of_day.end
      ) {
        return false
      }
    }

    // Add more condition types as needed

    return true
  }

  /**
   * Generate human-readable pricing explanation
   */
  private generateExplanation(factors: any): string {
    const parts: string[] = []

    if (factors.materialsCost > 0) {
      parts.push(`Materials: $${factors.materialsCost.toFixed(2)}`)
    }

    if (factors.laborCost > 0) {
      parts.push(`Labor: $${factors.laborCost.toFixed(2)}`)
    }

    if (factors.locationAdjustment !== 0) {
      parts.push(
        `Location: ${factors.locationAdjustment > 0 ? '+' : ''}$${factors.locationAdjustment.toFixed(2)}`
      )
    }

    if (factors.demandAdjustment > 0) {
      parts.push(`High demand: +$${factors.demandAdjustment.toFixed(2)}`)
    }

    if (factors.customerDiscount > 0) {
      parts.push(`Loyalty discount: -$${factors.customerDiscount.toFixed(2)}`)
    }

    if (factors.urgencyPremium > 0) {
      parts.push(`Rush premium: +$${factors.urgencyPremium.toFixed(2)}`)
    }

    if (factors.rulesApplied && factors.rulesApplied.length > 0) {
      factors.rulesApplied.forEach((rule: any) => {
        parts.push(
          `${rule.ruleName}: ${rule.adjustment > 0 ? '+' : ''}$${rule.adjustment.toFixed(2)}`
        )
      })
    }

    return parts.join(' | ')
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    params: PriceCalculationParams
  ): 'low' | 'medium' | 'high' {
    let score = 0

    if (params.serviceId) score += 1
    if (params.customerId) score += 1
    if (params.materials && params.materials.length > 0) score += 1
    if (params.estimatedHours > 0) score += 1
    if (params.scheduledDate) score += 1

    if (score >= 4) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }

  /**
   * Track pricing suggestion and outcome for ML improvement
   */
  async trackPricingSuggestion(
    estimateId: string,
    suggestion: PriceSuggestion,
    finalPrice: number
  ): Promise<void> {
    const wasAccepted = Math.abs(finalPrice - suggestion.suggestedPrice) < 10 // Within $10

    await db.insert(pricingHistory).values({
      companyId: this.companyId,
      estimateId: estimateId,
      basePrice: suggestion.basePrice.toString(),
      suggestedPrice: suggestion.suggestedPrice.toString(),
      finalPrice: finalPrice.toString(),
      factors: suggestion.breakdown as any,
      wasAccepted: wasAccepted,
      acceptanceRate: (
        (finalPrice / suggestion.suggestedPrice) * 100 -
        100
      ).toString(),
    })
  }
}
