'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Zap,
  MessageSquare,
  Calendar,
  Star,
  UserPlus,
  AlertCircle,
  Settings as SettingsIcon,
  Sparkles,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TemplateGallery } from '@/components/automations'
import { ScaleOnlyFeature } from '@/components/shared/ScaleOnlyFeature'
import {
  useAutomationTemplates,
  AutomationTemplate,
} from '@/hooks/use-automation-templates'
import { usePlanType } from '@/hooks/use-subscription'

// Stock automations (available to all Pro+ users)
const stockAutomations = [
  {
    name: 'Appointment Reminder',
    description: 'Send SMS 24 hours before scheduled jobs',
    icon: Calendar,
    enabled: true,
    executions: 127,
  },
  {
    name: 'Booking Confirmation',
    description: 'Confirm appointments when customers book online',
    icon: MessageSquare,
    enabled: true,
    executions: 89,
  },
  {
    name: 'Review Request',
    description: 'Ask for reviews 30 minutes after job completion',
    icon: Star,
    enabled: true,
    executions: 64,
  },
  {
    name: 'Assignment Notice',
    description: 'Notify team members when assigned to jobs',
    icon: UserPlus,
    enabled: false,
    executions: 0,
  },
  {
    name: 'Payment Reminder',
    description: 'Remind customers about overdue invoices',
    icon: AlertCircle,
    enabled: true,
    executions: 12,
  },
]

export function AutomationsPageClient() {
  const [activeTab, setActiveTab] = useState('stock')
  const [selectedCategory, setSelectedCategory] = useState<
    AutomationTemplate['category'] | undefined
  >(undefined)
  const { templates, isLoading } = useAutomationTemplates({
    category: selectedCategory,
  })
  const planType = usePlanType() || 'pro' // Default to pro if not loaded

  // Calculate stats
  const activeAutomations = stockAutomations.filter((a) => a.enabled).length
  const totalExecutions = stockAutomations.reduce(
    (sum, a) => sum + a.executions,
    0
  )

  const categories: Array<{
    value: AutomationTemplate['category'] | 'all'
    label: string
  }> = [
    { value: 'all', label: 'All Templates' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'workflow', label: 'Workflow' },
    { value: 'reactivation', label: 'Reactivation' },
    { value: 'upsell', label: 'Upsell' },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Automations
          </h1>
          <p className="text-muted-foreground">
            Automate your workflows and save time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Browse Templates
            <Badge variant="secondary" className="ml-1">
              Scale
            </Badge>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Active Automations
          </p>
          <p className="text-2xl font-bold">{activeAutomations}</p>
          <p className="text-xs text-green-600 mt-1">Running smoothly</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Executions This Month
          </p>
          <p className="text-2xl font-bold">{totalExecutions}</p>
          <p className="text-xs text-blue-600 mt-1">SMS & Email sent</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">98.6%</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stock">Stock Automations</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            Template Gallery
            <Badge variant="secondary" className="text-[10px]">
              Scale
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            Custom
            <Badge variant="secondary" className="text-[10px]">
              Scale
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Stock Automations Tab */}
        <TabsContent value="stock" className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Pre-built workflows included with your plan
            </p>
          </div>

          <div className="grid gap-4">
            {stockAutomations.map((automation) => {
              const Icon = automation.icon
              return (
                <Card
                  key={automation.name}
                  className="glass-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
                        automation.enabled
                          ? 'bg-gradient-to-br from-primary to-orange-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${automation.enabled ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{automation.name}</h3>
                        {automation.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {automation.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Executed {automation.executions} times</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="gap-2">
                        <SettingsIcon className="h-3 w-3" />
                        Configure
                      </Button>
                      <Switch checked={automation.enabled} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Template Gallery Tab */}
        <TabsContent value="templates" className="mt-6">
          <ScaleOnlyFeature
            currentPlan={planType}
            featureName="Automation Templates"
            description="Access a library of pre-built automation templates to supercharge your business workflows."
          >
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={
                      (cat.value === 'all' && !selectedCategory) ||
                      cat.value === selectedCategory
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedCategory(
                        cat.value === 'all'
                          ? undefined
                          : (cat.value as AutomationTemplate['category'])
                      )
                    }
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Templates Grid */}
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : (
                <TemplateGallery category={selectedCategory} />
              )}
            </div>
          </ScaleOnlyFeature>
        </TabsContent>

        {/* Custom Automations Tab */}
        <TabsContent value="custom" className="mt-6">
          <ScaleOnlyFeature
            currentPlan={planType}
            featureName="Custom Automations"
            description="Build your own custom workflows with our drag-and-drop automation builder."
          >
            <Card className="glass-card p-12 text-center border-dashed">
              <Zap className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                Create Your First Custom Automation
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Build powerful workflows tailored to your business. Combine
                triggers, conditions, and actions to automate any process.
              </p>
              <Link href="/automations/builder">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Automation
                </Button>
              </Link>
            </Card>
          </ScaleOnlyFeature>
        </TabsContent>
      </Tabs>
    </div>
  )
}
