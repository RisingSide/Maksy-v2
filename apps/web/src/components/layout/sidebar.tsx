'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  CheckSquare,
  Wrench,
  Users,
  UsersRound,
  FileText,
  Receipt,
  MapPin,
  Zap,
  Settings,
  Package,
  BarChart3,
  FileSignature,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  shouldHideNavItem,
  type PlanType,
  getPlanName,
} from '@/lib/feature-gates'
import { useSubscription } from '@/hooks/use-subscription'

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  requiredPlan?: 'pro' | 'scale'
  serviceBusinessOnly?: boolean // Hidden for Team plan
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Jobs', href: '/jobs', icon: Briefcase, serviceBusinessOnly: true },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  {
    name: 'Services',
    href: '/services',
    icon: Wrench,
    serviceBusinessOnly: true,
  },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Team', href: '/team', icon: UsersRound },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    serviceBusinessOnly: true,
  },
  {
    name: 'Estimates',
    href: '/estimates',
    icon: FileText,
    requiredPlan: 'pro',
    serviceBusinessOnly: true,
  },
  {
    name: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    requiredPlan: 'pro',
    serviceBusinessOnly: true,
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileSignature,
    requiredPlan: 'pro',
  },
  { name: 'Documents', href: '/documents', icon: FolderOpen },
  {
    name: 'Time & GPS',
    href: '/time-gps',
    icon: MapPin,
    requiredPlan: 'pro',
    serviceBusinessOnly: true,
  },
  { name: 'Automations', href: '/automations', icon: Zap, requiredPlan: 'pro' },
  { name: 'Reports', href: '/reports', icon: BarChart3, requiredPlan: 'pro' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoaded: isUserLoaded } = useUser()
  const { subscription, isLoading } = useSubscription()

  // Use actual subscription data, fallback to 'pro' while loading
  const currentPlan: PlanType = subscription?.planType || 'pro'

  // Get user initials and name from Clerk
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.firstName?.[0] || '?'
  const userName = user?.fullName || user?.firstName || 'User'

  // Filter navigation items based on plan
  const visibleNavigation = navigation.filter((item) => {
    return !shouldHideNavItem(currentPlan, item.href)
  })

  return (
    <div className="glass-sidebar fixed left-0 top-0 z-40 h-screen w-64 flex-col animate-fade-in hidden lg:flex">
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Maksy</h1>
            <p className="text-xs text-muted-foreground">Business OS</p>
          </div>
        </Link>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(244,161,37,0.5)]'
                  : 'text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>

              {item.badge && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {item.badge}
                </Badge>
              )}

              {item.requiredPlan === 'pro' && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-xs border-primary/30 text-primary"
                >
                  Pro
                </Badge>
              )}

              {item.requiredPlan === 'scale' && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-xs border-purple-500/30 text-purple-600"
                >
                  Scale
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-4" />

      {/* Settings & User */}
      <div className="p-4 space-y-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02] active:scale-[0.98]',
            pathname.startsWith('/settings')
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-sidebar-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>

        {/* User Profile */}
        <div className="glass-card p-3 rounded-lg mt-2">
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={userName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {isUserLoaded ? userInitials : '...'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isUserLoaded ? userName : 'Loading...'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : getPlanName(currentPlan)} Plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
