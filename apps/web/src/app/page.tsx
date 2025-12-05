import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
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
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="shadow-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Badge className="mb-6 animate-fade-in gap-2" variant="secondary">
          <Sparkles className="h-3 w-3" />
          Now with AI-powered automation
        </Badge>

        <h1
          className="text-6xl font-bold mb-6 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          The All-in-One Platform for
          <span className="block mt-2 bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            Service Businesses
          </span>
        </h1>

        <p
          className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          Schedule, invoice, and grow your business with AI. All the tools you
          need in one beautiful platform.
        </p>

        <div
          className="flex items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <Link href="/signup">
            <Button size="lg" className="shadow-2xl h-12 px-8 text-base">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              View Pricing
            </Button>
          </Link>
        </div>

        <p
          className="text-sm text-muted-foreground mt-4 animate-fade-in"
          style={{ animationDelay: '400ms' }}
        >
          No credit card required • Free 14-day trial • Cancel anytime
        </p>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="glass-card p-6 hover:shadow-2xl transition-all  animate-slide-in-bottom"
            style={{ animationDelay: '0ms' }}
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track revenue, jobs, and customer insights with real-time
              dashboards and AI-powered reports.
            </p>
          </Card>

          <Card
            className="glass-card p-6 hover:shadow-2xl transition-all  animate-slide-in-bottom"
            style={{ animationDelay: '100ms' }}
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">CRM Built-In</h3>
            <p className="text-sm text-muted-foreground">
              Manage unlimited customers with custom fields, job history, and
              lifetime value tracking.
            </p>
          </Card>

          <Card
            className="glass-card p-6 hover:shadow-2xl transition-all  animate-slide-in-bottom"
            style={{ animationDelay: '200ms' }}
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center mb-4 shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Job Management</h3>
            <p className="text-sm text-muted-foreground">
              Schedule, assign, and track jobs with GPS tracking, time logs, and
              team coordination.
            </p>
          </Card>

          <Card
            className="glass-card p-6 hover:shadow-2xl transition-all  animate-slide-in-bottom"
            style={{ animationDelay: '300ms' }}
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Automations</h3>
            <p className="text-sm text-muted-foreground">
              Automate reminders, confirmations, and follow-ups with smart SMS
              and email workflows.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes, not hours
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Sign Up & Setup</h3>
            <p className="text-muted-foreground">
              Create your account, add your business info, and customize your
              booking page in under 5 minutes.
            </p>
          </div>

          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Add Services & Team</h3>
            <p className="text-muted-foreground">
              Import your services, invite team members, and let customers start
              booking online.
            </p>
          </div>

          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Grow Your Business</h3>
            <p className="text-muted-foreground">
              Track jobs, send invoices, and let Maksy AI handle the rest while
              you focus on what matters.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="glass-card p-12 text-center">
          <p className="text-4xl font-bold mb-4">
            Join <span className="text-primary">1,000+</span> service businesses
          </p>
          <p className="text-xl text-muted-foreground mb-8">
            Already managing their operations with Maksy
          </p>
          <div className="flex items-center justify-center gap-8">
            <div>
              <p className="text-3xl font-bold text-primary">$2.4M+</p>
              <p className="text-sm text-muted-foreground">Revenue Processed</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div>
              <p className="text-3xl font-bold text-primary">15K+</p>
              <p className="text-sm text-muted-foreground">Jobs Completed</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div>
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="text-sm text-muted-foreground">
                Customer Satisfaction
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="glass-card p-16 text-center bg-gradient-to-br from-primary/10 to-orange-500/10 border-primary/20">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your free 14-day trial today. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup?plan=pro">
              <Button size="lg" className="shadow-2xl h-14 px-10 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg"
              >
                Compare Plans
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-semibold">Maksy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Maksy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
