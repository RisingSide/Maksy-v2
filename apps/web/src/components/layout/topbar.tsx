'use client'

import Image from 'next/image'
import { Search, Bell, Plus, ChevronDown, Sparkles, Menu } from 'lucide-react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { MaksyIntelDropdown } from '@/components/dashboard/maksy-intel-dropdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TopBar() {
  const { user, isLoaded } = useUser()

  // Get user initials and info from Clerk
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.firstName?.[0] || '?'
  const userName = user?.fullName || user?.firstName || 'User'
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''
  return (
    <div
      className="sticky top-0 z-50 h-16 border-b flex items-center justify-between px-6 animate-slide-in-top"
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers, jobs, invoices..."
            className="pl-10 bg-background/60 border-border/60 focus:bg-background transition-colors hidden sm:block"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-6">
        {/* Maksy Intel */}
        <MaksyIntelDropdown>
          <Button className="maksy-intel-button text-foreground shadow-lg hover:shadow-xl transition-all duration-150 gap-2 relative">
            <Sparkles className="h-4 w-4 relative z-10" />
            <span className="hidden sm:inline relative z-10">Maksy Intel</span>
            <ChevronDown className="h-3 w-3 relative z-10" />
          </Button>
        </MaksyIntelDropdown>

        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="shadow-lg hover:shadow-xl transition-all duration-150 gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>New Job</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>New Customer</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>New Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>New Task</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={userName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {isLoaded ? userInitials : '...'}
                  </span>
                </div>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem className="text-destructive cursor-pointer">
                Sign Out
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
