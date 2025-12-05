# 🎯 Quick Reference - Using New Features

## 1. TOAST NOTIFICATIONS

```tsx
import { toast } from 'sonner'

// In any component or function:
toast.success('Job created successfully!')
toast.error('Failed to save changes')
toast.info('Feature coming soon!')
toast.warning('Are you sure?')

// With loading state:
const loadingToast = toast.loading('Saving...')
// ... do async work ...
toast.success('Saved!', { id: loadingToast })
```

## 2. SKELETON LOADERS

```tsx
import {
  TableSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  FormSkeleton,
} from '@/components/ui/skeleton'

// Example usage in a page:
export default function JobsPage() {
  const [isLoading, setIsLoading] = useState(true)

  if (isLoading) {
    return <TableSkeleton rows={5} />
  }

  return <ActualJobsTable />
}
```

## 3. FORM FIELD COMPONENT

```tsx
import { FormField } from '@/components/ui/form-field'

export function MyForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <form>
      <FormField
        label="Customer Name"
        name="customerName"
        type="text"
        required
        placeholder="John Doe"
        error={errors.customerName}
      />

      <FormField
        label="Notes"
        name="notes"
        type="textarea"
        rows={4}
        placeholder="Additional details..."
      />
    </form>
  )
}
```

## 4. ICON SIZING

```tsx
import { Calendar, Settings, User } from "lucide-react"

// Use standardized classes:
<Calendar className="icon-xs" />  // 12px
<Settings className="icon-sm" />  // 16px
<User className="icon-md" />      // 20px
<Calendar className="icon-lg" />  // 24px
<Settings className="icon-xl" />  // 32px
```

## 5. ERROR BOUNDARY

Already wrapped around (protected) layout. If a component crashes, users see a friendly error message with "Reload Page" and "Go Back" buttons.

To test: `throw new Error("Test error")` in any component

## 6. SHARED TYPES

```tsx
import type {
  ModalProps,
  PageProps,
  JobStatus,
  PlanTier,
} from '@/types/components'

// Use in components:
interface MyModalProps extends ModalProps {
  jobId: string
}

export function MyModal({ open, onOpenChange, jobId }: MyModalProps) {
  // ...
}
```

## 7. BUTTON WITH TOAST FEEDBACK

```tsx
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

;<Button
  onClick={() => {
    toast.success('Feature coming soon!')
  }}
>
  Save Job
</Button>
```

## 8. MOBILE RESPONSIVE PATTERNS

```tsx
// Hide on mobile, show on desktop:
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop:
<div className="lg:hidden">Mobile only</div>

// Responsive grid:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

## 9. LOADING STATE PATTERN

```tsx
import { StatCardSkeleton } from '@/components/ui/skeleton'

export function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  return <ActualStats data={stats} />
}
```

## 10. ERROR HANDLING PATTERN

```tsx
import { toast } from "sonner"

async function saveJob() {
  try {
    // API call
    await fetch('/api/jobs', { method: 'POST', ... })
    toast.success("Job saved!")
  } catch (error) {
    toast.error("Failed to save job")
    console.error(error)
  }
}
```
