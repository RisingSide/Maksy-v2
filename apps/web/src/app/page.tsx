'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Maksy
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          All-in-one CRM, booking scheduler, and team management for service
          businesses
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Start your free Maksy account and get your business organized
              today.
            </p>
            <Button onClick={() => router.push('/signup')} className="w-full">
              Get Started Free
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Access your existing Maksy account to manage your service
              business.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
