import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { invoices, invoiceLineItems, customers, companies } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendInvoiceNotification } from '@/lib/notifications'

/**
 * POST /api/invoices/[id]/send
 * Send an invoice to the customer via email (and optionally SMS)
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

    // Get invoice with customer and company
    const invoiceResult = await db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(eq(invoices.id, id), eq(invoices.companyId, context.companyId))
      )
      .limit(1)

    if (!invoiceResult || invoiceResult.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { invoice, customer } = invoiceResult[0]

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
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id))
      .orderBy(invoiceLineItems.sortOrder)

    // Build payment link (if Stripe is configured)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const paymentLink = `${appUrl}/pay/${invoice.id}` // Public payment page

    // Send notifications
    const channels: ('email' | 'sms')[] = ['email']
    if (sendSms && customer.phone) {
      channels.push('sms')
    }

    const notificationResults = await sendInvoiceNotification({
      channels,
      customerEmail: customer.email,
      customerPhone: customer.phone || undefined,
      customerName: `${customer.firstName} ${customer.lastName}`,
      companyName: company.companyName,
      companyEmail: company.businessEmail || undefined,
      companyPhone: company.businessPhone || undefined,
      invoiceNumber: invoice.invoiceNumber,
      amount: parseFloat(invoice.total?.toString() || '0'),
      dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        total: parseFloat(item.totalPrice?.toString() || '0'),
      })),
      paymentLink,
      notes: invoice.notes || undefined,
    })

    // Check if at least email was sent successfully
    const emailResult = notificationResults.find((r) => r.channel === 'email')
    const emailSent = emailResult?.success ?? false

    // Update invoice status and sentAt
    const [updated] = await db
      .update(invoices)
      .set({
        status: invoice.status === 'draft' ? 'unpaid' : invoice.status,
        sentAt: emailSent ? new Date() : invoice.sentAt,
        updatedAt: new Date(),
      })
      .where(
        and(eq(invoices.id, id), eq(invoices.companyId, context.companyId))
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
        ? `Invoice sent to ${customer.email}${sentChannels.includes('sms') ? ' and via SMS' : ''}`
        : 'Failed to send invoice email',
      invoice: updated,
      notifications: {
        sent: sentChannels,
        failed: failedChannels,
      },
    })
  } catch (error: unknown) {
    console.error('Error sending invoice:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
