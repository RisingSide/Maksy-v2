import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="animate-scale-in">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'glass-card shadow-2xl',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/onboarding"
        />
      </div>
    </main>
  )
}
