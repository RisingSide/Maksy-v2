import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { invoices, customers, payments, companies } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { sendPaymentConfirmation } from '@/lib/notifications'

/**
 * POST /api/invoices/[id]/payment
 * Record a payment for an invoice
 */

const recordPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be at least $0.01'),
  paymentMethod: z
    .enum(['cash', 'check', 'card', 'bank_transfer', 'other'])
    .optional(),
  notes: z.string().optional().nullable(),
  sendConfirmation: z.boolean().optional().default(true),
})

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
    const body = await request.json()

    // Validate request body
    const validatedData = recordPaymentSchema.parse(body)

    // Get invoice with customer
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

    if (!invoiceResult.length) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { invoice: existingInvoice, customer } = invoiceResult[0]

    // Check if invoice is already paid
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      )
    }

    // Calculate new amount paid
    const currentAmountPaid = parseFloat(
      existingInvoice.amountPaid?.toString() || '0'
    )
    const invoiceTotal = parseFloat(existingInvoice.total?.toString() || '0')
    const newAmountPaid = currentAmountPaid + validatedData.amount

    // Determine new status
    let newStatus: 'unpaid' | 'partially_paid' | 'paid'
    if (newAmountPaid >= invoiceTotal) {
      newStatus = 'paid'
    } else if (newAmountPaid > 0) {
      newStatus = 'partially_paid'
    } else {
      newStatus = 'unpaid'
    }

    // Update invoice
    const [updated] = await db
      .update(invoices)
      .set({
        amountPaid: Math.min(newAmountPaid, invoiceTotal).toString(),
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : existingInvoice.paidAt,
        updatedAt: new Date(),
      })
      .where(
        and(eq(invoices.id, id), eq(invoices.companyId, context.companyId))
      )
      .returning()

    // Create payment record
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        companyId: context.companyId,
        invoiceId: id,
        amount: validatedData.amount.toString(),
        paymentMethod: validatedData.paymentMethod || 'other',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: validatedData.notes || null,
      })
      .returning()

    // Update customer lifetime value
    await db
      .update(customers)
      .set({
        lifetimeValue: sql`COALESCE(${customers.lifetimeValue}, 0) + ${validatedData.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, existingInvoice.customerId))

    // Send payment confirmation email
    if (validatedData.sendConfirmation && customer.email) {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, context.companyId),
      })

      if (company) {
        // Send confirmation (fire and forget)
        sendPaymentConfirmation({
          channels: ['email'],
          customerEmail: customer.email,
          customerPhone: customer.phone || undefined,
          customerName: `${customer.firstName} ${customer.lastName}`,
          companyName: company.companyName,
          invoiceNumber: existingInvoice.invoiceNumber,
          amount: validatedData.amount,
          paymentDate: new Date().toISOString(),
          paymentMethod: validatedData.paymentMethod
            ? validatedData.paymentMethod.charAt(0).toUpperCase() +
              validatedData.paymentMethod.slice(1).replace('_', ' ')
            : 'Payment',
        }).catch((err) => {
          console.error('Failed to send payment confirmation:', err)
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: newStatus === 'paid' ? 'Invoice fully paid' : 'Payment recorded',
      invoice: updated,
      payment: {
        id: paymentRecord.id,
        amount: validatedData.amount,
        method: validatedData.paymentMethod,
        remainingBalance: Math.max(0, invoiceTotal - newAmountPaid),
      },
    })
  } catch (error: unknown) {
    console.error('Error recording payment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}
