import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Rocket, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function PricingPage() {
  const plans = [
    {
      name: 'Maksy Pro',
      price: '$47',
      period: 'per month',
      description: 'For service businesses ready to level up',
      icon: Zap,
      features: [
        'Unlimited jobs & services',
        'Up to 5 team members',
        'Full invoicing & estimates',
        'Contracts & e-signatures',
        'Document management',
        'GPS & time tracking',
        'SMS automations',
        'Maksy AI (30 requests/day)',
        'Custom booking page',
        'Before/after photos',
        'Inventory tracking',
        'Advanced reports',
        'Email support (48h)',
      ],
      cta: 'Start 14-Day Trial',
      href: '/signup?plan=pro',
      highlighted: true,
    },
    {
      name: 'Maksy Scale',
      price: '$97',
      period: 'per month',
      description: 'For established businesses scaling operations',
      icon: Rocket,
      features: [
        'Everything in Pro, plus:',
        'Unlimited team members',
        'Maksy AI (50 requests/day)',
        'AI Contract Builder',
        'Financial AI Dashboard',
        'Dynamic AI Pricing Engine',
        'Automation templates',
        'Team commission tracking',
        'Priority support (24h)',
        'Mandatory 2FA',
        'Predictive analytics',
        'Daily backups',
        'Full audit logs',
      ],
      cta: 'Start 14-Day Trial',
      href: '/signup?plan=scale',
      highlighted: false,
    },
    {
      name: 'Maksy Team',
      price: '$29',
      period: '+ $8 per seat',
      description:
        'For teams who need powerful collaboration without job management',
      icon: Sparkles,
      features: [
        'Unlimited team members',
        'Task management',
        'Document management',
        'Contracts & e-signatures',
        'Customer CRM',
        'Team calendar',
        'Maksy AI (20 requests/day)',
        'Activity tracking',
        'Team collaboration tools',
        'Email notifications',
        'Basic reports',
        'Email support',
      ],
      locked: [
        'No jobs or services',
        'No invoicing',
        'No GPS tracking',
        'No inventory',
      ],
      cta: 'Start 14-Day Trial',
      href: '/signup?plan=team',
      highlighted: false,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="glass-card border-b border-border/40 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold">Maksy</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <Badge className="mb-6 animate-fade-in" variant="secondary">
          Choose the plan that grows with you
        </Badge>

        <h1
          className="text-5xl font-bold mb-4 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          Plans Built for Service Businesses
        </h1>

        <p
          className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          All plans include 14-day free trial. No credit card required to start.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.name}
                className={cn(
                  'glass-card p-8 hover:shadow-2xl transition-all  animate-slide-in-bottom',
                  plan.highlighted &&
                    'border-primary/50 shadow-xl shadow-primary/10 scale-105'
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {plan.highlighted && (
                  <Badge className="mb-4 bg-primary">Most Popular</Badge>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center shadow-lg',
                      plan.highlighted
                        ? 'bg-gradient-to-br from-primary to-orange-600'
                        : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">
                    / {plan.period}
                  </span>
                </div>

                <Link href={plan.href} className="block mb-8">
                  <Button
                    className={cn(
                      'w-full h-12 shadow-lg',
                      plan.highlighted &&
                        'bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700'
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.locked &&
                    plan.locked.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 opacity-50"
                      >
                        <div className="h-5 w-5 flex-shrink-0 mt-0.5"></div>
                        <span className="text-sm line-through">{feature}</span>
                      </div>
                    ))}
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-2">
              What happens after the free trial?
            </h3>
            <p className="text-sm text-muted-foreground">
              After your 14-day trial, add a payment method to continue with
              your chosen plan. No automatic charges during trial.
            </p>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-2">Can I change plans?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! Upgrade anytime instantly. Contact support to downgrade (to
              ensure proper data handling).
            </p>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-2">Is my data secure?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely. All data is encrypted at rest and in transit. We use
              Supabase (PostgreSQL) with enterprise-grade security.
            </p>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, we offer a 30-day money-back guarantee on all paid plans. No
              questions asked.
            </p>
          </Card>
        </div>
      </section>
    </main>
  )
}
