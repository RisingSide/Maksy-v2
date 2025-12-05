'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  DollarSign,
  Send,
  Download,
  Loader2,
  FileX,
} from 'lucide-react'
import { useInvoices, useInvoiceMutations, Invoice } from '@/hooks/use-invoices'
import { InvoiceCreateModal } from '@/components/invoices'
import { format } from 'date-fns'

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    Invoice['status'] | undefined
  >()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { invoices, total, isLoading, error, refetch } = useInvoices({
    status: statusFilter,
    limit: 50,
  })
  const {
    sendInvoice,
    recordPayment,
    isLoading: isMutating,
  } = useInvoiceMutations()

  // Filter invoices by search
  const filteredInvoices = useMemo(() => {
    if (!search) return invoices
    const searchLower = search.toLowerCase()
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.customer?.firstName?.toLowerCase().includes(searchLower) ||
        inv.customer?.lastName?.toLowerCase().includes(searchLower)
    )
  }, [invoices, search])

  // Calculate stats
  const stats = useMemo(() => {
    const outstanding = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce(
        (sum, inv) =>
          sum +
          parseFloat(inv.total || '0') -
          parseFloat(inv.amountPaid || '0'),
        0
      )

    const paidThisMonth = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.amountPaid || '0'), 0)

    const overdue = invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce(
        (sum, inv) =>
          sum +
          parseFloat(inv.total || '0') -
          parseFloat(inv.amountPaid || '0'),
        0
      )

    const overdueCount = invoices.filter(
      (inv) => inv.status === 'overdue'
    ).length
    const paidCount = invoices.filter((inv) => inv.status === 'paid').length
    const unpaidCount = invoices.filter(
      (inv) => inv.status === 'sent' || inv.status === 'draft'
    ).length

    return {
      outstanding,
      paidThisMonth,
      overdue,
      overdueCount,
      paidCount,
      unpaidCount,
    }
  }, [invoices])

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Paid
          </Badge>
        )
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Sent
          </Badge>
        )
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            Draft
          </Badge>
        )
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Overdue
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500">
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const handleSendInvoice = async (id: string) => {
    await sendInvoice(id)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card p-8 text-center max-w-md">
          <FileX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Invoices</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Invoices</h1>
          <p className="text-muted-foreground">Manage billing and payments</p>
        </div>
        <Button
          className="shadow-lg gap-2"
          onClick={() => setCreateModalOpen(true)}
          data-action="create-invoice"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Total Outstanding
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.outstanding)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.unpaidCount} unpaid
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Paid This Month</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.paidThisMonth)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {stats.paidCount} invoices
          </p>
        </Card>
        <Card className="glass-card p-4 border-red-200 dark:border-red-900/50">
          <p className="text-sm text-muted-foreground mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.overdue)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {stats.overdueCount} invoice{stats.overdueCount !== 1 ? 's' : ''}
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Invoices</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
      </div>

      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {filteredInvoices.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? 'No invoices match your search.'
              : 'Create your first invoice to get started.'}
          </p>
          {!search && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </Card>
      ) : (
        <Card className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-4 font-semibold text-sm">
                  Invoice #
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Customer
                </th>
                <th className="text-left p-4 font-semibold text-sm">Amount</th>
                <th className="text-left p-4 font-semibold text-sm">
                  Due Date
                </th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                >
                  <td className="p-4">
                    <span className="font-mono font-semibold text-sm">
                      {invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                        {invoice.customer
                          ? `${invoice.customer.firstName?.[0] || ''}${invoice.customer.lastName?.[0] || ''}`
                          : '?'}
                      </div>
                      <span>
                        {invoice.customer
                          ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                          : 'Unknown Customer'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {parseFloat(invoice.total || '0').toLocaleString(
                        'en-US',
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {invoice.dueDate
                      ? format(new Date(invoice.dueDate), 'MMM d, yyyy')
                      : '-'}
                  </td>
                  <td className="p-4">{getStatusBadge(invoice.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {(invoice.status === 'draft' ||
                        invoice.status === 'sent') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleSendInvoice(invoice.id)}
                          disabled={isMutating}
                        >
                          <Send className="h-3 w-3" />
                          {invoice.status === 'draft' ? 'Send' : 'Resend'}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Invoice Modal */}
      <InvoiceCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          refetch()
          setCreateModalOpen(false)
        }}
      />
    </div>
  )
}
