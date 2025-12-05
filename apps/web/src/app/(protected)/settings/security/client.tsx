'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  LogOut,
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettingsClient() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleManageSecurity = async () => {
    // Clerk provides a user profile page for managing security settings
    // This opens the Clerk-hosted user profile
    if (user) {
      window.open('https://accounts.maksy.app/user/security', '_blank')
    }
  }

  const handleSignOutAllDevices = async () => {
    if (
      !confirm(
        'This will sign you out of all devices except this one. Continue?'
      )
    ) {
      return
    }

    setIsLoading('signout')
    try {
      // Note: This would require Clerk's session management API
      // For now, we'll show a message
      toast.info('To sign out of all devices, please use the Clerk user portal')
      handleManageSecurity()
    } catch (error) {
      toast.error('Failed to sign out of other devices')
    } finally {
      setIsLoading(null)
    }
  }

  // Check if user has 2FA enabled (Clerk provides this info)
  const has2FA = user?.twoFactorEnabled || false
  const hasPasswordAuth = user?.passwordEnabled || false
  const hasOAuth = (user?.externalAccounts?.length || 0) > 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Security</h1>
        <p className="text-muted-foreground">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Security Overview */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Security Status</h2>
            <p className="text-sm text-muted-foreground">
              Your account security overview
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                has2FA ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}
            >
              {has2FA ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div>
              <p className="font-medium">Two-Factor Auth</p>
              <p className="text-sm text-muted-foreground">
                {has2FA ? 'Enabled' : 'Not enabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Email Verified</p>
              <p className="text-sm text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Key className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Sign-in Methods</p>
              <p className="text-sm text-muted-foreground">
                {[hasPasswordAuth && 'Password', hasOAuth && 'Social']
                  .filter(Boolean)
                  .join(', ') || 'None'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <Badge variant={has2FA ? 'default' : 'secondary'}>
            {has2FA ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Two-factor authentication adds an extra layer of security by requiring
          a code from your authenticator app in addition to your password when
          signing in.
        </p>

        <Button
          variant={has2FA ? 'outline' : 'default'}
          onClick={handleManageSecurity}
        >
          {has2FA ? 'Manage 2FA' : 'Enable 2FA'}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </Card>

      {/* Password */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Password</h3>
              <p className="text-sm text-muted-foreground">
                {hasPasswordAuth
                  ? 'Change your password or add new sign-in methods'
                  : 'Set up a password for your account'}
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={handleManageSecurity}>
          {hasPasswordAuth ? 'Change Password' : 'Set Password'}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </Card>

      {/* Connected Accounts */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Connected Accounts</h3>
            <p className="text-sm text-muted-foreground">
              Social accounts linked to your profile
            </p>
          </div>
        </div>

        {user?.externalAccounts && user.externalAccounts.length > 0 ? (
          <div className="space-y-3">
            {user.externalAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {account.provider === 'google' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {account.provider === 'github' && (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{account.provider}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.emailAddress}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No social accounts connected
          </p>
        )}

        <Button
          variant="outline"
          className="mt-4"
          onClick={handleManageSecurity}
        >
          Manage Connections
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </Card>

      {/* Active Sessions */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Manage devices where you&apos;re signed in
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Current Session</p>
              <p className="text-sm text-muted-foreground">
                This device • Active now
              </p>
            </div>
            <Badge variant="secondary">Current</Badge>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleSignOutAllDevices}
          disabled={isLoading === 'signout'}
          className="text-destructive hover:text-destructive"
        >
          {isLoading === 'signout' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All Other Devices
            </>
          )}
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card p-6 border-destructive/50">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Irreversible actions
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>

        <Button variant="destructive" onClick={handleManageSecurity}>
          Delete Account
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  )
}
