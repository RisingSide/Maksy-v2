import { NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { sql } from 'drizzle-orm'

/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns the health status of the application and its dependencies.
 * Used for:
 * - Load balancer health checks
 * - Uptime monitoring
 * - Deployment verification
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: CheckResult
    environment: CheckResult
  }
  uptime: number
}

interface CheckResult {
  status: 'pass' | 'fail'
  message?: string
  latency?: number
}

// Track server start time for uptime calculation
const startTime = Date.now()

export async function GET() {
  const checks: HealthStatus['checks'] = {
    database: { status: 'fail' },
    environment: { status: 'fail' },
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1`)
    const dbLatency = Date.now() - dbStart

    checks.database = {
      status: 'pass',
      message: 'Connected',
      latency: dbLatency,
    }
  } catch (error) {
    checks.database = {
      status: 'fail',
      message:
        error instanceof Error ? error.message : 'Database connection failed',
    }
  }

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  )

  if (missingEnvVars.length === 0) {
    checks.environment = {
      status: 'pass',
      message: 'All required variables present',
    }
  } else {
    checks.environment = {
      status: 'fail',
      message: `Missing: ${missingEnvVars.join(', ')}`,
    }
  }

  // Determine overall status
  const allPassing = Object.values(checks).every((c) => c.status === 'pass')
  const anyFailing = Object.values(checks).some((c) => c.status === 'fail')

  let overallStatus: HealthStatus['status'] = 'healthy'
  if (anyFailing) {
    overallStatus = checks.database.status === 'fail' ? 'unhealthy' : 'degraded'
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  }

  // Return appropriate status code
  const statusCode =
    overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(healthStatus, { status: statusCode })
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  try {
    await db.execute(sql`SELECT 1`)
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
