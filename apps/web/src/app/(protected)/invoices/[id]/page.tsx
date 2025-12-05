import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { invoices, invoiceLineItems, customers, payments } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { InvoiceDetailClient } from './client'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  const { id } = await params

  // Fetch invoice
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.companyId, context.companyId)),
  })

  if (!invoice) {
    notFound()
  }

  // Fetch customer
  const customer = invoice.customerId
    ? await db.query.customers.findFirst({
        where: eq(customers.id, invoice.customerId),
      })
    : null

  // Fetch line items
  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .orderBy(invoiceLineItems.sortOrder)

  // Fetch payments
  const invoicePayments = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id))
    .orderBy(desc(payments.paymentDate))

  return (
    <InvoiceDetailClient
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status as
          | 'draft'
          | 'unpaid'
          | 'paid'
          | 'partially_paid'
          | 'overdue'
          | 'canceled',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal
          ? parseFloat(invoice.subtotal.toString())
          : 0,
        taxAmount: invoice.taxAmount
          ? parseFloat(invoice.taxAmount.toString())
          : 0,
        discountAmount: invoice.discountAmount
          ? parseFloat(invoice.discountAmount.toString())
          : 0,
        totalAmount: invoice.total ? parseFloat(invoice.total.toString()) : 0,
        amountPaid: invoice.amountPaid
          ? parseFloat(invoice.amountPaid.toString())
          : 0,
        notes: invoice.notes,
        termsAndConditions: invoice.paymentTerms,
        sentAt: invoice.sentAt?.toISOString() || null,
        paidAt: invoice.paidAt?.toISOString() || null,
        createdAt: invoice.createdAt.toISOString(),
      }}
      customer={
        customer
          ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              companyName: customer.companyName,
              address: customer.addressLine1
                ? {
                    line1: customer.addressLine1,
                    line2: customer.addressLine2,
                    city: customer.city,
                    state: customer.state,
                    zip: customer.zipCode,
                  }
                : null,
            }
          : null
      }
      lineItems={lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        totalPrice: parseFloat(item.totalPrice.toString()),
      }))}
      payments={invoicePayments.map((p) => ({
        id: p.id,
        amount: parseFloat(p.amount.toString()),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        notes: p.notes,
      }))}
    />
  )
}
