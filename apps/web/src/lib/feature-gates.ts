/**
 * Feature Gating System
 *
 * Controls access to features based on subscription plan type.
 *
 * Three plans:
 * - Pro ($47/month): Service businesses with up to 5 team members
 * - Scale ($97/month): Growing service businesses with unlimited team
 * - Team ($29/month + $8/seat): Non-service businesses (CRM, tasks, documents only)
 */

export type PlanType = 'pro' | 'scale' | 'team'

/**
 * Check if a plan is a service business plan (has access to jobs, services, estimates, invoices, GPS)
 */
export const isServiceBusinessPlan = (plan: PlanType): boolean => {
  return plan === 'pro' || plan === 'scale'
}

/**
 * Check if a plan is the Team plan (no service business features)
 */
export const isTeamPlan = (plan: PlanType): boolean => {
  return plan === 'team'
}

/**
 * Check if a plan is the Scale plan (has access to advanced features)
 */
export const isScalePlan = (plan: PlanType): boolean => {
  return plan === 'scale'
}

/**
 * Feature availability by plan
 */
export const PLAN_FEATURES = {
  pro: {
    // Core Platform
    jobs: true,
    services: true,
    customers: true,
    calendar: true,
    tasks: true,
    inventory: true,

    // AI & Automation
    ai: { limit: 30, model: 'standard' as const },
    automations: 'stock' as const, // Stock templates only
    automationTemplates: false,
    automationBuilder: false,

    // Financial
    estimates: true,
    invoices: true,
    dynamicPricing: false,
    financialDashboard: false,
    paymentProcessing: true,
    coupons: true,

    // Field Operations
    gpsTracking: true,
    timeTracking: true,
    commissionTracking: false,
    beforeAfterPhotos: true,

    // Documents & Contracts
    contracts: true,
    aiContractBuilder: false,
    contractTemplates: 3, // Max 3 custom templates
    documents: true,
    documentMaxSize: 50, // MB

    // Customization
    bookingPage: true,
    removeBranding: true,
    customForms: 1,

    // Reporting
    advancedReports: true,
    aiInsights: false,
    exportData: 'csv' as const,

    // Team & Access
    teamLimit: 5,
    seatBased: false,

    // Support & Security
    support: 'email_48h' as const,
    twoFactorAuth: 'optional' as const,
    backups: 'daily' as const,
    auditLogs: 'basic' as const,
  },
  scale: {
    // Core Platform
    jobs: true,
    services: true,
    customers: true,
    calendar: true,
    tasks: true,
    inventory: true,

    // AI & Automation
    ai: { limit: 50, model: 'advanced' as const },
    automations: 'full' as const, // Stock + builder
    automationTemplates: true,
    automationBuilder: true,

    // Financial
    estimates: true,
    invoices: true,
    dynamicPricing: true,
    financialDashboard: true,
    paymentProcessing: true,
    coupons: true,

    // Field Operations
    gpsTracking: true,
    timeTracking: true,
    commissionTracking: true,
    beforeAfterPhotos: true,

    // Documents & Contracts
    contracts: true,
    aiContractBuilder: true,
    contractTemplates: Infinity, // Unlimited
    documents: true,
    documentMaxSize: 100, // MB

    // Customization
    bookingPage: true,
    removeBranding: true,
    customForms: Infinity,

    // Reporting
    advancedReports: true,
    aiInsights: true,
    exportData: 'all' as const,

    // Team & Access
    teamLimit: Infinity,
    seatBased: false,

    // Support & Security
    support: 'priority_24h' as const,
    twoFactorAuth: 'required' as const,
    backups: 'daily_extended' as const,
    auditLogs: 'full' as const,
  },
  team: {
    // Core Platform
    jobs: false,
    services: false,
    customers: true,
    calendar: true, // Tasks only, not jobs
    tasks: true,
    inventory: false,

    // AI & Automation
    ai: { limit: 30, model: 'standard' as const },
    automations: 'stock' as const,
    automationTemplates: false,
    automationBuilder: false,

    // Financial
    estimates: false,
    invoices: false,
    dynamicPricing: false,
    financialDashboard: false,
    paymentProcessing: false,
    coupons: false,

    // Field Operations
    gpsTracking: false,
    timeTracking: false,
    commissionTracking: false,
    beforeAfterPhotos: false,

    // Documents & Contracts
    contracts: true,
    aiContractBuilder: false,
    contractTemplates: 3,
    documents: true,
    documentMaxSize: 50, // MB

    // Customization
    bookingPage: false,
    removeBranding: true,
    customForms: 1,

    // Reporting
    advancedReports: true,
    aiInsights: false,
    exportData: 'csv' as const,

    // Team & Access
    teamLimit: Infinity,
    seatBased: true, // $8 per additional seat

    // Support & Security
    support: 'email_48h' as const,
    twoFactorAuth: 'optional' as const,
    backups: 'daily' as const,
    auditLogs: 'basic' as const,
  },
} as const

/**
 * Get feature access for a specific plan and feature
 */
export const getFeatureAccess = <F extends keyof typeof PLAN_FEATURES.pro>(
  plan: PlanType,
  feature: F
):
  | (typeof PLAN_FEATURES.pro)[F]
  | (typeof PLAN_FEATURES.scale)[F]
  | (typeof PLAN_FEATURES.team)[F] => {
  return PLAN_FEATURES[plan][feature] as any
}

/**
 * Check if a plan has access to a boolean feature
 */
export const hasFeature = (
  plan: PlanType,
  feature: keyof typeof PLAN_FEATURES.pro
): boolean => {
  const access = PLAN_FEATURES[plan][feature]
  if (typeof access === 'boolean') {
    return access
  }
  // For non-boolean features, return false
  return false
}

/**
 * Get the upgrade path for a feature
 */
export const getUpgradePath = (
  currentPlan: PlanType,
  feature: keyof typeof PLAN_FEATURES.pro
): PlanType | null => {
  // If already has access, no upgrade needed
  if (hasFeature(currentPlan, feature)) {
    return null
  }

  // Check Pro first (cheaper upgrade)
  if (hasFeature('pro', feature)) {
    return 'pro'
  }

  // Check Scale
  if (hasFeature('scale', feature)) {
    return 'scale'
  }

  // Feature not available on any plan
  return null
}

/**
 * Get human-readable plan name
 */
export const getPlanName = (plan: PlanType): string => {
  const names: Record<PlanType, string> = {
    pro: 'Pro',
    scale: 'Scale',
    team: 'Maksy Team',
  }
  return names[plan]
}

/**
 * Get plan price
 */
export const getPlanPrice = (
  plan: PlanType,
  seatCount: number = 1
): { base: number; perSeat?: number; total: number } => {
  const prices = {
    pro: { base: 47, total: 47 },
    scale: { base: 97, total: 97 },
    team: { base: 29, perSeat: 8, total: 29 + Math.max(0, seatCount - 1) * 8 },
  }
  return prices[plan]
}

/**
 * Feature gate error messages
 */
export const getUpgradeMessage = (
  feature: string,
  requiredPlan: PlanType
): string => {
  const planName = getPlanName(requiredPlan)
  return `${feature} is only available on the ${planName} plan. Upgrade to unlock this feature.`
}

/**
 * Navigation items that should be hidden based on plan
 */
export const shouldHideNavItem = (plan: PlanType, route: string): boolean => {
  // Team plan hides service business features
  if (isTeamPlan(plan)) {
    const hiddenRoutes = [
      '/jobs',
      '/services',
      '/estimates',
      '/invoices',
      '/time-gps',
      '/booking',
    ]
    return hiddenRoutes.some((hiddenRoute) => route.startsWith(hiddenRoute))
  }

  // Scale-only features
  if (plan !== 'scale') {
    const scaleOnlyRoutes = ['/automations/builder']
    return scaleOnlyRoutes.some((scaleRoute) => route.startsWith(scaleRoute))
  }

  return false
}
