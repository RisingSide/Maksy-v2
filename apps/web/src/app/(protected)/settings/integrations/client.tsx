'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plug,
  CreditCard,
  Calculator,
  Calendar,
  MapPin,
  MessageSquare,
  Mail,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Integrations {
  stripeConnected: boolean
  quickbooksConnected: boolean
  googleCalendarConnected: boolean
  googleBusinessConnected: boolean
  twilioConnected: boolean
  resendConnected: boolean
}

interface IntegrationsSettingsClientProps {
  integrations: Integrations
  planType: string
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  connected: boolean
  category:
    | 'payments'
    | 'accounting'
    | 'calendar'
    | 'marketing'
    | 'communication'
  planRequired?: string
  setupUrl?: string
  docsUrl?: string
}

export function IntegrationsSettingsClient({
  integrations,
  planType,
}: IntegrationsSettingsClientProps) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const allIntegrations: Integration[] = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept credit card payments and manage subscriptions',
      icon: CreditCard,
      color: '#635BFF',
      connected: integrations.stripeConnected,
      category: 'payments',
      setupUrl: '/api/integrations/stripe/connect',
      docsUrl: 'https://stripe.com/docs',
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync invoices and expenses with your accounting',
      icon: Calculator,
      color: '#2CA01C',
      connected: integrations.quickbooksConnected,
      category: 'accounting',
      planRequired: 'scale',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync your jobs and appointments with Google Calendar',
      icon: Calendar,
      color: '#4285F4',
      connected: integrations.googleCalendarConnected,
      category: 'calendar',
    },
    {
      id: 'google-business',
      name: 'Google Business Profile',
      description: 'Manage reviews and business information',
      icon: MapPin,
      color: '#34A853',
      connected: integrations.googleBusinessConnected,
      category: 'marketing',
      planRequired: 'pro',
    },
    {
      id: 'twilio',
      name: 'Twilio SMS',
      description: 'Send SMS notifications to customers',
      icon: MessageSquare,
      color: '#F22F46',
      connected: integrations.twilioConnected,
      category: 'communication',
    },
    {
      id: 'resend',
      name: 'Resend Email',
      description: 'Send transactional emails to customers',
      icon: Mail,
      color: '#000000',
      connected: integrations.resendConnected,
      category: 'communication',
    },
  ]

  const categories = [
    { id: 'payments', label: 'Payments' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'communication', label: 'Communication' },
  ]

  const handleConnect = async (integration: Integration) => {
    // Check plan requirements
    if (integration.planRequired) {
      const planOrder = { team: 0, pro: 1, scale: 2 }
      const currentPlanLevel =
        planOrder[planType as keyof typeof planOrder] ?? 0
      const requiredPlanLevel =
        planOrder[integration.planRequired as keyof typeof planOrder] ?? 0

      if (currentPlanLevel < requiredPlanLevel) {
        toast.error(
          `${integration.name} requires ${integration.planRequired.charAt(0).toUpperCase() + integration.planRequired.slice(1)} plan`
        )
        return
      }
    }

    setConnecting(integration.id)
    try {
      if (integration.setupUrl) {
        // Redirect to OAuth flow
        window.location.href = integration.setupUrl
      } else {
        // Show coming soon message
        toast.info(`${integration.name} integration coming soon!`)
      }
    } catch (error) {
      toast.error(`Failed to connect ${integration.name}`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return
    }

    setConnecting(integration.id)
    try {
      // In a real implementation, call disconnect API
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success(`${integration.name} disconnected`)
    } catch (error) {
      toast.error(`Failed to disconnect ${integration.name}`)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Integrations
        </h1>
        <p className="text-muted-foreground">
          Connect third-party services to extend Maksy&apos;s functionality
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(integrations).filter(Boolean).length}
              </p>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Plug className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allIntegrations.length}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{planType}</p>
              <p className="text-sm text-muted-foreground">Current Plan</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrations by Category */}
      {categories.map((category) => {
        const categoryIntegrations = allIntegrations.filter(
          (i) => i.category === category.id
        )
        if (categoryIntegrations.length === 0) return null

        return (
          <div key={category.id}>
            <h2 className="text-lg font-semibold mb-4">{category.label}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryIntegrations.map((integration) => {
                const Icon = integration.icon
                const isConnecting = connecting === integration.id

                return (
                  <Card
                    key={integration.id}
                    className={cn(
                      'glass-card p-6',
                      integration.connected && 'border-green-500/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: integration.color + '20' }}
                        >
                          <Icon
                            className="h-6 w-6"
                            style={{ color: integration.color }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {integration.name}
                            </h3>
                            {integration.connected && (
                              <Badge variant="default" className="bg-green-500">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                            {integration.planRequired &&
                              !integration.connected && (
                                <Badge
                                  variant="secondary"
                                  className="capitalize"
                                >
                                  {integration.planRequired}
                                </Badge>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      {integration.connected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(integration)}
                            disabled={isConnecting}
                          >
                            {isConnecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Disconnect'
                            )}
                          </Button>
                          {integration.docsUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={integration.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Docs
                              </a>
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(integration)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Zapier Card */}
      <Card className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-orange-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15h2v6h-2V7zm0 8h2v2h-2v-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Zapier</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect Maksy to 5,000+ apps with Zapier. Create automated
              workflows without code.
            </p>
            <Badge variant="secondary" className="mt-2">
              Coming Soon
            </Badge>
          </div>
        </div>
      </Card>

      {/* API Access */}
      <Card className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-purple-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">API Access</h3>
              <Badge variant="secondary">Scale</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Build custom integrations with the Maksy API. Full REST API access
              for Scale plan users.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={planType !== 'scale'}
            >
              View API Docs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
