'use client'

/**
 * Automation Templates Gallery
 *
 * Browse and activate pre-built automation workflows (Scale tier only)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  FileText,
  Briefcase,
  UserPlus,
  RefreshCw,
  TrendingUp,
  ArrowLeft,
  Check,
} from 'lucide-react'
import Link from 'next/link'

// Temporary mock data - will be replaced with API call
const categories = [
  { id: 'all', label: 'All Templates' },
  { id: 'follow_up', label: 'Follow-ups' },
  { id: 'workflow', label: 'Workflows' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'reactivation', label: 'Reactivation' },
  { id: 'upsell', label: 'Upsell' },
]

const mockTemplates = [
  {
    id: '1',
    name: 'Estimate Follow-up',
    description:
      "Automatically follow up on estimates that haven't been approved within 3 days",
    category: 'follow_up',
    icon: FileText,
    usageCount: 1247,
    steps: 5,
  },
  {
    id: '2',
    name: 'New Job Workflow',
    description:
      'Complete workflow for new jobs: assign team, send confirmations, reminders, and request reviews',
    category: 'workflow',
    icon: Briefcase,
    usageCount: 3891,
    steps: 7,
  },
  {
    id: '3',
    name: 'Customer Onboarding',
    description:
      'Welcome new customers with a branded introduction and intake process',
    category: 'onboarding',
    icon: UserPlus,
    usageCount: 2156,
    steps: 4,
  },
  {
    id: '4',
    name: 'Inactive Customer Reactivation',
    description:
      "Re-engage customers who haven't booked in 90+ days with personalized outreach",
    category: 'reactivation',
    icon: RefreshCw,
    usageCount: 987,
    steps: 4,
  },
  {
    id: '5',
    name: 'Upsell After Service',
    description:
      'Suggest related services 24 hours after job completion to drive additional revenue',
    category: 'upsell',
    icon: TrendingUp,
    usageCount: 1523,
    steps: 5,
  },
]

export default function AutomationTemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activatingTemplate, setActivatingTemplate] = useState<string | null>(
    null
  )

  const filteredTemplates =
    activeCategory === 'all'
      ? mockTemplates
      : mockTemplates.filter((t) => t.category === activeCategory)

  const handleUseTemplate = (templateId: string) => {
    setActivatingTemplate(templateId)

    // TODO: Replace with actual API call
    // Example:
    // const response = await fetch(`/api/automation-templates/${templateId}/use`, { method: 'POST' })
    // if (response.ok) { setActivatingTemplate(null); show success; redirect }

    // Temporary mock simulation
    setTimeout(() => {
      setActivatingTemplate(null)
      // TODO: Show success message and redirect to automations
    }, 1000)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/automations"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Automations
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Automation Templates</h1>
            <p className="text-muted-foreground">
              Plug-and-play workflows to save time and grow your business
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="mb-8"
      >
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = template.icon
          const isActivating = activatingTemplate === template.id

          return (
            <Card
              key={template.id}
              className="flex flex-col hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {template.usageCount.toLocaleString()} uses
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{template.steps} steps</span>
                  <span>•</span>
                  <span className="capitalize">
                    {template.category.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    /* TODO: Open preview modal */
                  }}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseTemplate(template.id)}
                  disabled={isActivating}
                >
                  {isActivating ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Activated
                    </>
                  ) : (
                    'Use Template'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No templates found in this category.
          </p>
        </div>
      )}
    </div>
  )
}
