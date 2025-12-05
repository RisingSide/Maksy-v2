import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { estimates, estimateLineItems, customers, companies } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEstimateNotification } from '@/lib/notifications'

/**
 * POST /api/estimates/[id]/send
 * Send an estimate to the customer via email (and optionally SMS)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Parse request body for options
    let sendSms = false
    try {
      const body = await request.json()
      sendSms = body.sendSms === true
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Get estimate with customer
    const estimateResult = await db
      .select({
        estimate: estimates,
        customer: customers,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )
      .limit(1)

    if (!estimateResult || estimateResult.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    const { estimate, customer } = estimateResult[0]

    // Check if customer has an email
    if (!customer.email) {
      return NextResponse.json(
        { error: 'Customer does not have an email address' },
        { status: 400 }
      )
    }

    // Get company details
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, context.companyId),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get line items
    const lineItems = await db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, id))
      .orderBy(estimateLineItems.sortOrder)

    // Build approve link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const approveLink = `${appUrl}/estimates/approve/${estimate.id}` // Public approval page

    // Send notifications
    const channels: ('email' | 'sms')[] = ['email']
    if (sendSms && customer.phone) {
      channels.push('sms')
    }

    const notificationResults = await sendEstimateNotification({
      channels,
      customerEmail: customer.email,
      customerPhone: customer.phone || undefined,
      customerName: `${customer.firstName} ${customer.lastName}`,
      companyName: company.companyName,
      companyEmail: company.businessEmail || undefined,
      companyPhone: company.businessPhone || undefined,
      estimateNumber: estimate.estimateNumber,
      amount: parseFloat(estimate.total?.toString() || '0'),
      expiresAt: estimate.expiresAt?.toISOString(),
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        total: parseFloat(item.totalPrice?.toString() || '0'),
      })),
      approveLink,
      notes: estimate.notes || undefined,
    })

    // Check if at least email was sent successfully
    const emailResult = notificationResults.find((r) => r.channel === 'email')
    const emailSent = emailResult?.success ?? false

    // Update estimate status and sentAt
    const [updated] = await db
      .update(estimates)
      .set({
        status: estimate.status === 'draft' ? 'sent' : estimate.status,
        sentAt: emailSent ? new Date() : estimate.sentAt,
        updatedAt: new Date(),
      })
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )
      .returning()

    // Build response message
    const sentChannels = notificationResults
      .filter((r) => r.success)
      .map((r) => r.channel)
    const failedChannels = notificationResults
      .filter((r) => !r.success)
      .map((r) => ({ channel: r.channel, error: r.error }))

    return NextResponse.json({
      success: emailSent,
      message: emailSent
        ? `Estimate sent to ${customer.email}${sentChannels.includes('sms') ? ' and via SMS' : ''}`
        : 'Failed to send estimate email',
      estimate: updated,
      notifications: {
        sent: sentChannels,
        failed: failedChannels,
      },
    })
  } catch (error: unknown) {
    console.error('Error sending estimate:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to send estimate' },
      { status: 500 }
    )
  }
}
