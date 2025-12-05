# Phase 2 UI Implementation Guide

## Overview

All Phase 2 features are now complete, including both backend infrastructure and UI components.

**Status:** ✅ COMPLETE (December 4, 2024)

### What Was Implemented

- ✅ Financial AI Dashboard (`FinancialInsightsSection`)
- ✅ AI Contract Builder (`ContractGenerationModal`)
- ✅ Dynamic AI Pricing (`AIPriceButton`)
- ✅ Automation Templates (`TemplateGallery`)
- ✅ All supporting hooks and API integrations

---

## Reference Documentation (Originally Planned)

---

## 1. Automation Templates Gallery ✅ COMPLETE

### Location

- `/apps/web/src/app/(protected)/automations/page.tsx`
- `/apps/web/src/components/automations/TemplateGallery.tsx`

### API Endpoints

- `GET /api/automation-templates` - List all templates ✅
- `POST /api/automation-templates/[id]/use` - Create automation from template ✅

### Components Implemented

```tsx
// /components/automations/TemplateGallery.tsx
interface TemplateGalleryProps {
  category?: string
  onSelect: (templateId: string) => void
}

// /components/automations/TemplateCard.tsx
interface TemplateCardProps {
  template: {
    id: string
    name: string
    description: string
    category: string
    icon: string
    usage_count: number
  }
  onUse: () => void
}

// /components/automations/UseTemplateModal.tsx
interface UseTemplateModalProps {
  templateId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (automation: any) => void
}
```

### Template Categories

- `follow_up` - Follow-up sequences
- `onboarding` - Customer onboarding flows
- `workflow` - Job/service workflows
- `reactivation` - Re-engagement campaigns
- `upsell` - Cross-sell sequences

### Icon Mapping (Lucide)

```tsx
const iconMap = {
  FileText: FileText,
  Briefcase: Briefcase,
  UserPlus: UserPlus,
  RefreshCw: RefreshCw,
  TrendingUp: TrendingUp,
}
```

---

## 2. Financial AI Dashboard ✅ COMPLETE

### Location

- `/apps/web/src/components/dashboard/FinancialInsightsSection.tsx`
- Integrated into Dashboard for Scale users

### API Endpoints

- `GET /api/financial/insights` - List insights ✅
- `POST /api/financial/insights` - Generate new insights ✅
- `GET /api/financial/analysis` - On-demand analysis ✅
- `GET /api/financial/forecast` - Revenue forecast ✅

### Components Implemented

```tsx
// /components/dashboard/FinancialInsightsSection.tsx
interface FinancialInsightsSectionProps {
  companyId: string
  planType: 'pro' | 'scale' | 'team'
}

// /components/dashboard/InsightCard.tsx
interface InsightCardProps {
  insight: {
    id: string
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
    is_read: boolean
  }
  onDismiss: () => void
  onMarkRead: () => void
}

// /components/dashboard/FinancialHealthScore.tsx
interface FinancialHealthScoreProps {
  insights: FinancialInsight[]
}

// /components/dashboard/RevenueForecastChart.tsx
interface RevenueForecastChartProps {
  forecastData: {
    monthly_revenue: Record<string, number>
    projected_quarterly: number
    growth_pct: number
  }
}
```

### Priority Colors

```tsx
const priorityColors = {
  low: 'text-green-500 bg-green-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  high: 'text-orange-500 bg-orange-500/10',
  critical: 'text-red-500 bg-red-500/10',
}
```

### Insight Type Icons

```tsx
const insightIcons = {
  margin_alert: AlertTriangle,
  pricing_suggestion: DollarSign,
  forecast: TrendingUp,
  cost_analysis: PieChart,
  cash_flow: Wallet,
}
```

---

## 3. AI Contract Builder ✅ COMPLETE

### Location

- `/apps/web/src/components/contracts/ContractGenerationModal.tsx`
- Integrated into `/contracts` page

### API Endpoint

- `POST /api/contracts/ai-generate` - Generate contract ✅

### Components Implemented

```tsx
// /components/contracts/AIGenerateButton.tsx
interface AIGenerateButtonProps {
  onGenerate: (params: ContractGenerationParams) => void
  disabled?: boolean
}

// /components/contracts/ContractGenerationModal.tsx
interface ContractGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerated: (contract: GeneratedContract) => void
}

// /components/contracts/ContractPreview.tsx
interface ContractPreviewProps {
  contract: GeneratedContract
  onEdit: () => void
  onSave: () => void
}
```

### Generation Form Fields

```tsx
interface ContractGenerationParams {
  projectType: string // "HVAC Installation", "Landscaping", etc.
  projectSize: 'small' | 'medium' | 'large'
  location: string // Address or region
  materials: string[] // List of materials
  estimatedValue: number // Dollar amount
  customerId?: string // Optional customer
  includeWarranty: boolean
  includePaymentTerms: boolean
  customNotes?: string
}
```

---

## 4. Dynamic AI Pricing ✅ COMPLETE

### Location

- `/apps/web/src/components/estimates/AIPriceButton.tsx`
- Ready for integration in estimates flow

### API Endpoints

- `GET /api/pricing/rules` - List pricing rules ✅
- `POST /api/pricing/rules` - Create pricing rule ✅
- `POST /api/pricing/calculate` - Get AI price suggestion ✅

### Components Implemented

```tsx
// /components/estimates/AIPriceButton.tsx
interface AIPriceButtonProps {
  serviceId: string
  customerId: string
  location: string
  estimatedHours: number
  onPriceCalculated: (suggestion: PriceSuggestion) => void
}

// /components/estimates/PriceBreakdown.tsx
interface PriceBreakdownProps {
  breakdown: {
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
  suggestedPrice: number
  confidence: 'low' | 'medium' | 'high'
}

// /components/settings/PricingRulesPage.tsx
// Full page for managing pricing rules
```

### Pricing Rule Types

```tsx
type RuleType = 'surge' | 'discount' | 'multiplier' | 'seasonal'

interface PricingRule {
  id: string
  name: string
  rule_type: RuleType
  conditions: Record<string, any>
  adjustment: {
    type: 'percentage' | 'fixed'
    value: number
  }
  is_active: boolean
  priority: number
}
```

---

## 5. Feature Gate UI Patterns ✅ IMPLEMENTED

### Scale-Only Feature Wrapper

```tsx
// /components/shared/ScaleOnlyFeature.tsx ✅ EXISTS
import { getFeatureAccess } from '@/lib/feature-gates'

interface ScaleOnlyFeatureProps {
  planType: 'pro' | 'scale' | 'team'
  feature:
    | 'automationTemplates'
    | 'financialDashboard'
    | 'dynamicPricing'
    | 'aiContractBuilder'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ScaleOnlyFeature({
  planType,
  feature,
  children,
  fallback,
}: ScaleOnlyFeatureProps) {
  const hasAccess = getFeatureAccess(planType, feature)

  if (!hasAccess) {
    return fallback || <UpgradePrompt feature={feature} requiredPlan="scale" />
  }

  return <>{children}</>
}
```

### Upgrade Prompt Component

```tsx
// /components/feature-gate/UpgradePrompt.tsx
interface UpgradePromptProps {
  feature: string
  requiredPlan: 'pro' | 'scale'
}

export function UpgradePrompt({ feature, requiredPlan }: UpgradePromptProps) {
  return (
    <Card className="glass-card p-6 text-center">
      <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="font-semibold mb-2">Scale Plan Feature</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {getUpgradeMessage(feature, requiredPlan)}
      </p>
      <Button asChild>
        <Link href="/settings/billing">Upgrade to Scale</Link>
      </Button>
    </Card>
  )
}
```

---

## 6. Implementation Order ✅ ALL COMPLETE

### Completed Build Order

1. **Financial AI Dashboard** ✅ COMPLETE
   - `FinancialInsightsSection.tsx`
   - `useFinancialInsights` hook
   - `useRevenueForecast` hook

2. **AI Contract Builder** ✅ COMPLETE
   - `ContractGenerationModal.tsx`
   - `ContractPreviewModal.tsx`
   - `useContracts` hook

3. **Dynamic Pricing** ✅ COMPLETE
   - `AIPriceButton.tsx`
   - `usePricing` hook
   - `usePricingRules` hook

4. **Automation Templates** ✅ COMPLETE
   - `TemplateGallery.tsx`
   - `UseTemplateModal.tsx`
   - `useAutomationTemplates` hook

---

## 7. Testing Checklist

### For Each Feature

- [x] Verify feature gate blocks Pro/Team users
- [x] Verify Scale users can access
- [x] Test API error handling
- [x] Test loading states
- [x] Test empty states
- [x] Dark mode compatibility
- [ ] Mobile responsiveness (ongoing)

### API Response Handling

```tsx
// Standard pattern for Scale features
const { data, error, isLoading } = useSWR(
  planType === 'scale' ? '/api/financial/insights' : null,
  fetcher
)

if (planType !== 'scale') {
  return <UpgradePrompt feature="Financial AI" requiredPlan="scale" />
}

if (isLoading) {
  return <Skeleton />
}

if (error) {
  return <ErrorCard message="Failed to load insights" />
}
```

---

## 8. Styling Guidelines

### Glass Card Pattern (Consistent with App)

```tsx
<Card className="glass-card p-6">{/* Content */}</Card>
```

### AI Feature Accent Color

```tsx
// Use purple for AI features
<Badge className="bg-purple-500/10 text-purple-500">
  <Sparkles className="h-3 w-3 mr-1" />
  AI Powered
</Badge>
```

### Loading States

```tsx
// Use skeleton with shimmer
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
  <div className="h-4 bg-muted rounded w-1/2" />
</div>
```

---

## Summary

✅ **PHASE 2 COMPLETE** (December 4, 2024)

All components have been implemented:

- ✅ Database tables
- ✅ API endpoints
- ✅ AI services
- ✅ Feature gates
- ✅ Seed data
- ✅ UI Components
- ✅ React Hooks
- ✅ Page Integration

**All Scale-tier features are now live and integrated.**
