'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DollarSign,
  Plus,
  Trash2,
  Settings2,
  TrendingUp,
  MapPin,
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  Sparkles,
  Save,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import {
  usePricingRules,
  usePricingMutations,
  PricingRule,
} from '@/hooks/use-pricing'
import { usePlanType } from '@/hooks/use-subscription'
import { ScaleOnlyFeature } from '@/components/shared/ScaleOnlyFeature'
import { toast } from 'sonner'

const factorIcons: Record<string, typeof DollarSign> = {
  location: MapPin,
  time_of_day: Clock,
  demand: TrendingUp,
  customer_type: Users,
  seasonal: Calendar,
  urgency: AlertTriangle,
}

const factorLabels: Record<string, string> = {
  location: 'Location Premium',
  time_of_day: 'Time of Day',
  demand: 'Demand Multiplier',
  customer_type: 'Customer Type',
  seasonal: 'Seasonal Adjustment',
  urgency: 'Urgency Pricing',
}

const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'contains', label: 'Contains' },
  { value: 'in_range', label: 'In range' },
]

function PricingRuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: PricingRule
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const Icon = factorIcons[rule.factor] || Settings2

  return (
    <Card className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              rule.isActive
                ? 'bg-gradient-to-br from-primary to-orange-600'
                : 'bg-muted'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${rule.isActive ? 'text-white' : 'text-muted-foreground'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold">{rule.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {factorLabels[rule.factor] || rule.factor}
            </p>
          </div>
        </div>
        <Switch checked={rule.isActive} onCheckedChange={onToggle} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Adjustment</span>
          <Badge variant={rule.adjustment >= 0 ? 'default' : 'secondary'}>
            {rule.adjustmentType === 'percentage'
              ? `${rule.adjustment >= 0 ? '+' : ''}${rule.adjustment}%`
              : `${rule.adjustment >= 0 ? '+' : ''}$${Math.abs(rule.adjustment)}`}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Priority</span>
          <span className="font-medium">{rule.priority}</span>
        </div>
        {rule.conditions && rule.conditions.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {rule.conditions.length} condition
            {rule.conditions.length !== 1 ? 's' : ''} applied
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  )
}

function CreateRuleModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<PricingRule>) => void
  initialData?: PricingRule | null
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    factor: initialData?.factor || 'location',
    adjustmentType: initialData?.adjustmentType || 'percentage',
    adjustment: initialData?.adjustment || 10,
    priority: initialData?.priority || 1,
    conditions: initialData?.conditions || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure how this factor affects your dynamic pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Premium Location Surcharge"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Pricing Factor</Label>
              <Select
                value={formData.factor}
                onValueChange={(value) =>
                  setFormData({ ...formData, factor: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(factorLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select
                  value={formData.adjustmentType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      adjustmentType: value as 'percentage' | 'fixed',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Value</Label>
                <Input
                  type="number"
                  value={formData.adjustment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adjustment: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority (1-10)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.priority]}
                  onValueChange={(values: number[]) =>
                    setFormData({ ...formData, priority: values[0] })
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-medium">
                  {formData.priority}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Higher priority rules are applied first
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              {initialData ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PricingSettingsContent() {
  const { rules, isLoading } = usePricingRules()
  const { createRule, updateRule, deleteRule } = usePricingMutations()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)

  const handleCreateRule = async (data: Partial<PricingRule>) => {
    try {
      await createRule(data)
      toast.success('Pricing rule created')
    } catch {
      toast.error('Failed to create pricing rule')
    }
  }

  const handleUpdateRule = async (data: Partial<PricingRule>) => {
    if (!editingRule) return
    try {
      await updateRule(editingRule.id, data)
      toast.success('Pricing rule updated')
      setEditingRule(null)
    } catch {
      toast.error('Failed to update pricing rule')
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule(id)
      toast.success('Pricing rule deleted')
    } catch {
      toast.error('Failed to delete pricing rule')
    }
  }

  const handleToggleRule = async (rule: PricingRule) => {
    try {
      await updateRule(rule.id, { isActive: !rule.isActive })
      toast.success(rule.isActive ? 'Rule disabled' : 'Rule enabled')
    } catch {
      toast.error('Failed to toggle rule')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Rules</p>
              <p className="text-2xl font-bold">{rules.length}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Rules</p>
              <p className="text-2xl font-bold">
                {rules.filter((r) => r.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AI Suggestions</p>
              <p className="text-2xl font-bold">Enabled</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Rules Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pricing Rules</h2>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">No Pricing Rules</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first dynamic pricing rule to optimize your quotes.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Rule
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <PricingRuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => handleDeleteRule(rule.id)}
              onToggle={() => handleToggleRule(rule)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateRuleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateRule}
      />

      {/* Edit Modal */}
      <CreateRuleModal
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
        onSubmit={handleUpdateRule}
        initialData={editingRule}
      />
    </>
  )
}

export default function PricingSettingsPage() {
  const planType = usePlanType() || 'pro'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">
              AI Pricing Rules
            </h1>
            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
              Scale
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Configure dynamic pricing factors for intelligent quote generation
          </p>
        </div>
      </div>

      <ScaleOnlyFeature
        currentPlan={planType}
        featureName="AI Pricing Rules"
        description="Create custom pricing rules that automatically adjust your quotes based on location, demand, time, and more."
      >
        <PricingSettingsContent />
      </ScaleOnlyFeature>
    </div>
  )
}
