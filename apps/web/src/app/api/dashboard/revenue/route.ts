import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { invoices } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

/**
 * GET /api/dashboard/revenue
 * Get revenue data for charts (monthly breakdown)
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    // Default: last 12 months
    const months = parseInt(searchParams.get('months') || '12')
    const now = new Date()

    // Calculate start date (X months ago, first day of month)
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1
    )

    // Get monthly revenue data
    const revenueData = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.paidAt}, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, context.companyId),
          eq(invoices.status, 'paid'),
          gte(invoices.paidAt, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${invoices.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoices.paidAt}, 'YYYY-MM')`)

    // Get invoiced amounts (for comparison)
    const invoicedData = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.issueDate}::timestamp, 'YYYY-MM')`,
        invoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, context.companyId),
          gte(invoices.issueDate, startDate.toISOString().split('T')[0])
        )
      )
      .groupBy(sql`TO_CHAR(${invoices.issueDate}::timestamp, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoices.issueDate}::timestamp, 'YYYY-MM')`)

    // Create a map of all months in the range
    const monthlyData: {
      [key: string]: {
        month: string
        revenue: number
        invoiced: number
        invoiceCount: number
      }
    } = {}

    // Initialize all months with zeros
    for (let i = 0; i < months; i++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - months + 1 + i,
        1
      )
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = {
        month: monthKey,
        revenue: 0,
        invoiced: 0,
        invoiceCount: 0,
      }
    }

    // Fill in revenue data
    for (const row of revenueData) {
      if (row.month && monthlyData[row.month]) {
        monthlyData[row.month].revenue = Number(row.revenue)
        monthlyData[row.month].invoiceCount = Number(row.invoiceCount)
      }
    }

    // Fill in invoiced data
    for (const row of invoicedData) {
      if (row.month && monthlyData[row.month]) {
        monthlyData[row.month].invoiced = Number(row.invoiced)
      }
    }

    // Convert to array and sort
    const chartData = Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    )

    // Calculate totals
    const totalRevenue = chartData.reduce((sum, m) => sum + m.revenue, 0)
    const totalInvoiced = chartData.reduce((sum, m) => sum + m.invoiced, 0)

    // Calculate month-over-month growth
    let growth = 0
    if (chartData.length >= 2) {
      const currentMonth = chartData[chartData.length - 1].revenue
      const previousMonth = chartData[chartData.length - 2].revenue
      if (previousMonth > 0) {
        growth = Math.round(
          ((currentMonth - previousMonth) / previousMonth) * 100
        )
      }
    }

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        months,
      },
      summary: {
        totalRevenue,
        totalInvoiced,
        collectionRate:
          totalInvoiced > 0
            ? Math.round((totalRevenue / totalInvoiced) * 100)
            : 0,
        monthOverMonthGrowth: growth,
      },
      chartData,
    })
  } catch (error: any) {
    console.error('Error fetching revenue data:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}
