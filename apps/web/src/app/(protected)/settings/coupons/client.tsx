'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  Copy,
  Trash2,
  Loader2,
  Check,
  Users,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  title: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  startDate: string | null
  endDate: string | null
  totalUsageLimit: number | null
  usagePerCustomerLimit: number | null
  isActive: boolean
  minimumOrderValue: number | null
}

interface CouponsSettingsClientProps {
  coupons: Coupon[]
  planType: string
}

const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function CouponsSettingsClient({
  coupons: initialCoupons,
  planType,
}: CouponsSettingsClientProps) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    startDate: '',
    endDate: '',
    totalUsageLimit: '',
    usagePerCustomerLimit: '',
    minimumOrderValue: '',
    isActive: true,
  })

  const resetForm = () => {
    setFormData({
      code: generateCouponCode(),
      title: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      totalUsageLimit: '',
      usagePerCustomerLimit: '',
      minimumOrderValue: '',
      isActive: true,
    })
    setEditingCoupon(null)
  }

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code,
        title: coupon.title || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        startDate: coupon.startDate || '',
        endDate: coupon.endDate || '',
        totalUsageLimit: coupon.totalUsageLimit?.toString() || '',
        usagePerCustomerLimit: coupon.usagePerCustomerLimit?.toString() || '',
        minimumOrderValue: coupon.minimumOrderValue?.toString() || '',
        isActive: coupon.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.discountValue) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingCoupon
        ? `/api/coupons/${editingCoupon.id}`
        : '/api/coupons'
      const method = editingCoupon ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          title: formData.title || null,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          totalUsageLimit: formData.totalUsageLimit
            ? parseInt(formData.totalUsageLimit)
            : null,
          usagePerCustomerLimit: formData.usagePerCustomerLimit
            ? parseInt(formData.usagePerCustomerLimit)
            : null,
          minimumOrderValue: formData.minimumOrderValue
            ? parseFloat(formData.minimumOrderValue)
            : null,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save coupon')
      }

      const data = await response.json()

      if (editingCoupon) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === editingCoupon.id ? data.coupon : c))
        )
        toast.success('Coupon updated!')
      } else {
        setCoupons((prev) => [data.coupon, ...prev])
        toast.success('Coupon created!')
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save coupon'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete coupon')

      setCoupons((prev) => prev.filter((c) => c.id !== couponId))
      toast.success('Coupon deleted!')
    } catch (error) {
      toast.error('Failed to delete coupon')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      if (!response.ok) throw new Error('Failed to update coupon')

      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
        )
      )
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}!`)
    } catch (error) {
      toast.error('Failed to update coupon')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied!')
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% off`
    }
    return `$${coupon.discountValue.toFixed(2)} off`
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.endDate) return false
    return new Date(coupon.endDate) < new Date()
  }

  const isAtLimit = (coupon: Coupon) => {
    // TODO: Implement usage count tracking from couponUsages table
    return false
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Coupons</h1>
          <p className="text-muted-foreground">
            Create discount codes for your customers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SAVE20"
                    className="font-mono uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({ ...formData, code: generateCouponCode() })
                    }
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label>Title (optional)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Summer Sale"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: e.target.value,
                        })
                      }
                      placeholder={
                        formData.discountType === 'percentage' ? '20' : '10.00'
                      }
                      className="pl-8"
                    />
                    {formData.discountType === 'percentage' ? (
                      <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.totalUsageLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalUsageLimit: e.target.value,
                      })
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label>Per Customer Limit</Label>
                  <Input
                    type="number"
                    value={formData.usagePerCustomerLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usagePerCustomerLimit: e.target.value,
                      })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <Label>Minimum Order Value</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.minimumOrderValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumOrderValue: e.target.value,
                      })
                    }
                    placeholder="No minimum"
                    className="pl-8"
                  />
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingCoupon ? (
                    'Update Coupon'
                  ) : (
                    'Create Coupon'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.length}</p>
              <p className="text-sm text-muted-foreground">Total Coupons</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {
                  coupons.filter(
                    (c) => c.isActive && !isExpired(c) && !isAtLimit(c)
                  ).length
                }
              </p>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Total Redemptions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No coupons yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first coupon to offer discounts to customers
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon)
            const atLimit = isAtLimit(coupon)
            const active = coupon.isActive && !expired && !atLimit

            return (
              <Card
                key={coupon.id}
                className={cn('glass-card p-4', !active && 'opacity-60')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-xl flex items-center justify-center',
                        active
                          ? 'bg-gradient-to-br from-primary to-orange-600'
                          : 'bg-muted'
                      )}
                    >
                      {coupon.discountType === 'percentage' ? (
                        <Percent className="h-6 w-6 text-white" />
                      ) : (
                        <DollarSign className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-lg">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(coupon.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {formatDiscount(coupon)}
                        </span>
                        {coupon.title && (
                          <>
                            <span>•</span>
                            <span>{coupon.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      {expired && <Badge variant="destructive">Expired</Badge>}
                      {atLimit && (
                        <Badge variant="secondary">Limit Reached</Badge>
                      )}
                      {!expired && !atLimit && (
                        <Badge
                          variant={coupon.isActive ? 'default' : 'secondary'}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </div>

                    {/* Usage stats */}
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          -
                          {coupon.totalUsageLimit &&
                            ` / ${coupon.totalUsageLimit}`}
                        </span>
                      </div>
                      {coupon.endDate && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {expired ? 'Expired' : `Until ${coupon.endDate}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={() => handleToggleActive(coupon)}
                        disabled={expired || atLimit}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(coupon)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
