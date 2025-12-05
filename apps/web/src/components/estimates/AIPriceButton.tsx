'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Info,
} from 'lucide-react'
import { usePricing, PriceSuggestion } from '@/hooks/use-pricing'

interface AIPriceButtonProps {
  serviceId: string
  customerId: string
  location: string
  estimatedHours: number
  urgency?: 'normal' | 'rush'
  scheduledDate?: string
  onPriceAccepted: (price: number) => void
  disabled?: boolean
}

const confidenceColors = {
  low: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  high: 'bg-green-500/10 text-green-600 dark:text-green-400',
}

const confidenceLabels = {
  low: 'Low Confidence',
  medium: 'Medium Confidence',
  high: 'High Confidence',
}

function PriceBreakdownItem({
  label,
  value,
  isPositive,
}: {
  label: string
  value: number
  isPositive?: boolean
}) {
  if (value === 0) return null

  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus
  const color =
    isPositive === undefined
      ? 'text-muted-foreground'
      : isPositive
        ? 'text-green-600'
        : 'text-red-600'

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium flex items-center gap-1 ${color}`}>
        {value > 0 && '+'}${Math.abs(value).toFixed(2)}
        <Icon className="h-3 w-3" />
      </span>
    </div>
  )
}

export function AIPriceButton({
  serviceId,
  customerId,
  location,
  estimatedHours,
  urgency = 'normal',
  scheduledDate,
  onPriceAccepted,
  disabled,
}: AIPriceButtonProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { suggestion, isLoading, calculatePrice, clearSuggestion } =
    usePricing()

  const handleCalculate = async () => {
    try {
      await calculatePrice({
        serviceId,
        customerId,
        location,
        estimatedHours,
        urgency,
        scheduledDate,
      })
      setShowBreakdown(true)
    } catch {
      // Error handled by hook
    }
  }

  const handleAccept = () => {
    if (suggestion) {
      onPriceAccepted(suggestion.suggestedPrice)
      setShowBreakdown(false)
      clearSuggestion()
    }
  }

  const canCalculate = serviceId && customerId && location && estimatedHours > 0

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleCalculate}
        disabled={disabled || isLoading || !canCalculate}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Get AI Price
            <Badge variant="secondary" className="text-[10px] px-1">
              Scale
            </Badge>
          </>
        )}
      </Button>

      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Price Suggestion
            </DialogTitle>
            <DialogDescription>Based on 9 pricing factors</DialogDescription>
          </DialogHeader>

          {suggestion && (
            <div className="space-y-4 mt-4">
              {/* Main Price */}
              <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">
                  Suggested Price
                </p>
                <p className="text-4xl font-bold">
                  ${suggestion.suggestedPrice.toLocaleString()}
                </p>
                <Badge
                  className={`mt-2 ${confidenceColors[suggestion.confidence]}`}
                >
                  {confidenceLabels[suggestion.confidence]}
                </Badge>
              </div>

              {/* Breakdown */}
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Price Breakdown
                </h4>
                <div className="divide-y divide-border/50">
                  <PriceBreakdownItem
                    label="Service Base"
                    value={suggestion.breakdown.serviceBase}
                  />
                  <PriceBreakdownItem
                    label="Materials"
                    value={suggestion.breakdown.materials}
                  />
                  <PriceBreakdownItem
                    label="Labor"
                    value={suggestion.breakdown.labor}
                  />
                  <PriceBreakdownItem
                    label="Location Adjustment"
                    value={suggestion.breakdown.locationAdjustment}
                    isPositive={suggestion.breakdown.locationAdjustment > 0}
                  />
                  <PriceBreakdownItem
                    label="Demand Adjustment"
                    value={suggestion.breakdown.demandAdjustment}
                    isPositive={suggestion.breakdown.demandAdjustment > 0}
                  />
                  <PriceBreakdownItem
                    label="Customer Discount"
                    value={-suggestion.breakdown.customerDiscount}
                    isPositive={false}
                  />
                  <PriceBreakdownItem
                    label="Seasonal Adjustment"
                    value={suggestion.breakdown.seasonalAdjustment}
                    isPositive={suggestion.breakdown.seasonalAdjustment > 0}
                  />
                  <PriceBreakdownItem
                    label="Urgency Premium"
                    value={suggestion.breakdown.urgencyPremium}
                    isPositive={suggestion.breakdown.urgencyPremium > 0}
                  />
                  <PriceBreakdownItem
                    label="Rules Adjustment"
                    value={suggestion.breakdown.rulesAdjustment}
                    isPositive={suggestion.breakdown.rulesAdjustment > 0}
                  />
                </div>
              </Card>

              {/* Explanation */}
              {suggestion.explanation && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {suggestion.explanation}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBreakdown(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleAccept}>
                  <CheckCircle className="h-4 w-4" />
                  Use This Price
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
