'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Send,
  Download,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Invoice {
  id: string
  invoiceNumber: string
  status:
    | 'draft'
    | 'unpaid'
    | 'paid'
    | 'partially_paid'
    | 'overdue'
    | 'canceled'
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  amountPaid: number
  notes: string | null
  termsAndConditions: string | null
  sentAt: string | null
  paidAt: string | null
  createdAt: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string | null
  address: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    zip: string | null
  } | null
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Payment {
  id: string
  amount: number
  paymentMethod: string | null
  paymentDate: string
  notes: string | null
}

interface InvoiceDetailClientProps {
  invoice: Invoice
  customer: Customer | null
  lineItems: LineItem[]
  payments: Payment[]
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
  unpaid: { label: 'Unpaid', color: 'bg-blue-500', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-500', icon: CheckCircle2 },
  partially_paid: {
    label: 'Partially Paid',
    color: 'bg-yellow-500',
    icon: DollarSign,
  },
  overdue: { label: 'Overdue', color: 'bg-red-500', icon: AlertCircle },
  canceled: { label: 'Canceled', color: 'bg-gray-500', icon: XCircle },
}

export function InvoiceDetailClient({
  invoice,
  customer,
  lineItems,
  payments,
}: InvoiceDetailClientProps) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [isSending, setIsSending] = useState(false)
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(
    (invoice.totalAmount - invoice.amountPaid).toFixed(2)
  )
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [copied, setCopied] = useState(false)

  const statusConfig = STATUS_CONFIG[invoice.status]
  const StatusIcon = statusConfig.icon
  const balanceDue = invoice.totalAmount - invoice.amountPaid

  const handleSendInvoice = async () => {
    if (!customer?.email) {
      toast.error('Customer email is required to send invoice')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to send invoice')

      toast.success('Invoice sent successfully!')
      router.refresh()
    } catch (error) {
      toast.error('Failed to send invoice')
    } finally {
      setIsSending(false)
    }
  }

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsRecordingPayment(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod,
        }),
      })

      if (!response.ok) throw new Error('Failed to record payment')

      toast.success('Payment recorded!')
      setPaymentDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Failed to record payment')
    } finally {
      setIsRecordingPayment(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/pay/${invoice.id}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Payment link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAddress = (address: Customer['address']) => {
    if (!address?.line1) return null
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state, address.zip].filter(Boolean).join(', '),
    ].filter(Boolean)
    return parts.join('\n')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Invoice {invoice.invoiceNumber}
              </h1>
              <Badge className={cn('text-white', statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <Button onClick={handleSendInvoice} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
            <Dialog
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Balance due: ${balanceDue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPaymentDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      disabled={isRecordingPayment}
                      className="flex-1"
                    >
                      {isRecordingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        'Record Payment'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Preview */}
        <div className="lg:col-span-2">
          <Card className="glass-card p-8" ref={printRef}>
            {/* Invoice Header */}
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-primary">INVOICE</h2>
                <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">
                  {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Due Date</p>
                <p className="font-medium">
                  {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Bill To */}
            {customer && (
              <div className="mb-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Bill To
                </p>
                <p className="font-medium">
                  {customer.companyName ||
                    `${customer.firstName} ${customer.lastName}`}
                </p>
                {customer.companyName && (
                  <p className="text-sm text-muted-foreground">
                    {customer.firstName} {customer.lastName}
                  </p>
                )}
                {customer.address?.line1 && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                    {formatAddress(customer.address)}
                  </p>
                )}
                {customer.email && (
                  <p className="text-sm text-muted-foreground">
                    {customer.email}
                  </p>
                )}
              </div>
            )}

            {/* Line Items */}
            <div className="mb-8">
              <div className="grid grid-cols-12 gap-4 py-3 border-b font-medium text-sm text-muted-foreground">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b text-sm"
                >
                  <div className="col-span-6">{item.description}</div>
                  <div className="col-span-2 text-right">{item.quantity}</div>
                  <div className="col-span-2 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    ${item.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${invoice.totalAmount.toFixed(2)}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>-${invoice.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Balance Due</span>
                      <span>${balanceDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-8 border-t">
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.termsAndConditions && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Terms & Conditions</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.termsAndConditions}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Link */}
          {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Payment Link
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share this link with your customer to collect payment online.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Payment Link
                  </>
                )}
              </Button>
            </Card>
          )}

          {/* Customer Card */}
          {customer && (
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer
              </h3>
              <div className="space-y-3">
                <p className="font-medium">
                  {customer.firstName} {customer.lastName}
                </p>
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </a>
                )}
                <Link href={`/customers?id=${customer.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Customer
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Payment History */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment History
            </h3>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {payment.paymentMethod?.replace('_', ' ') || 'Other'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payments recorded
              </p>
            )}
          </Card>

          {/* Timeline */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(invoice.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>
              {invoice.sentAt && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Sent</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(invoice.sentAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Paid</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(invoice.paidAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
