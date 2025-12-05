import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  User,
  Building2,
  Users,
  Globe,
  Sparkles,
  Database,
  FileText,
  Tag,
  Plug,
  Bell,
  BarChart3,
  Shield,
  CreditCard,
  ChevronRight,
  DollarSign,
} from 'lucide-react'

export default function SettingsPage() {
  const sections = [
    {
      category: 'Personal',
      items: [
        {
          name: 'Profile',
          description: 'Manage your personal information',
          icon: User,
          href: '/settings/profile',
        },
      ],
    },
    {
      category: 'Company',
      items: [
        {
          name: 'Company Details',
          description: 'Business info and branding',
          icon: Building2,
          href: '/settings/company',
        },
        {
          name: 'Team',
          description: 'Invite and manage team members',
          icon: Users,
          href: '/settings/team',
          badge: 'Pro',
        },
        {
          name: 'Booking Page',
          description: 'Customize your public booking page',
          icon: Globe,
          href: '/settings/booking',
        },
      ],
    },
    {
      category: 'Features',
      items: [
        {
          name: 'Ask Maksy',
          description: 'AI usage and preferences',
          icon: Sparkles,
          href: '/settings/ask-maksy',
          badge: 'Pro',
        },
        {
          name: 'AI Pricing Rules',
          description: 'Dynamic pricing configuration',
          icon: DollarSign,
          href: '/settings/pricing',
          badge: 'Scale',
        },
        {
          name: 'Customer Fields',
          description: 'Custom data fields',
          icon: Database,
          href: '/settings/fields',
        },
        {
          name: 'Forms',
          description: 'Custom form builder',
          icon: FileText,
          href: '/settings/forms',
          badge: 'Pro',
        },
        {
          name: 'Coupons',
          description: 'Discount codes and promotions',
          icon: Tag,
          href: '/settings/coupons',
          badge: 'Pro',
        },
      ],
    },
    {
      category: 'Integrations & Preferences',
      items: [
        {
          name: 'Integrations',
          description: 'Connect external services',
          icon: Plug,
          href: '/settings/integrations',
        },
        {
          name: 'Notifications',
          description: 'Email and SMS preferences',
          icon: Bell,
          href: '/settings/notifications',
        },
        {
          name: 'Reports',
          description: 'Report settings and exports',
          icon: BarChart3,
          href: '/settings/reports',
        },
      ],
    },
    {
      category: 'Security & Billing',
      items: [
        {
          name: 'Security',
          description: '2FA and account protection',
          icon: Shield,
          href: '/settings/security',
        },
        {
          name: 'Plan & Billing',
          description: 'Subscription and payments',
          icon: CreditCard,
          href: '/settings/billing',
        },
      ],
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.category}>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            {section.category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.name} href={item.href}>
                  <Card className="glass-card p-6 hover:shadow-xl transition-all  cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
