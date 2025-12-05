import { ReactNode } from 'react'

// Base component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

// Next.js page props
export interface PageProps {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

// Modal/Dialog props
export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Table/List item props
export interface TableItemProps {
  id: string | number
}

// Form field base props
export interface FormFieldBaseProps {
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
}

// Status types
export type JobStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PlanTier = 'pro' | 'scale' | 'team'

// Common UI props
export interface IconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export interface LoadingProps {
  isLoading?: boolean
  loadingText?: string
}

export interface ErrorProps {
  error?: string | null
  onRetry?: () => void
}

// Feature gating
export interface FeatureGateProps {
  requiredPlan?: PlanTier
  currentPlan?: PlanTier
  children: ReactNode
  fallback?: ReactNode
}
