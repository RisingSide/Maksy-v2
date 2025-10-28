export default function Home() {
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create Account</h2>
          <p className="text-gray-600 mb-4">
            Start your free Maksy account and get your business organized today.
          </p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Get Started Free
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sign In</h2>
          <p className="text-gray-600 mb-4">
            Access your existing Maksy account to manage your service business.
          </p>
          <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50">
            Sign In
          </button>
        </div>
      </div>
    </main>
  )
}
