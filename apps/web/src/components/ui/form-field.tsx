'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  name: string
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'textarea'
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  value?: string
  defaultValue?: string
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  rows?: number
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required,
  disabled,
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  rows = 4,
}: FormFieldProps) {
  const isTextarea = type === 'textarea'

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {isTextarea ? (
        <Textarea
          id={name}
          name={name}
          placeholder={placeholder}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
        />
      )}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}
