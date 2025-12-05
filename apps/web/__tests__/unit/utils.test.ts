import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('base-class', 'additional-class')
    expect(result).toBe('base-class additional-class')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toBe('base active')
  })

  it('should filter out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid')
    expect(result).toBe('base valid')
  })

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6')
    // tailwind-merge should keep px-6 and py-2
    expect(result).toBe('py-2 px-6')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'])
    expect(result).toBe('class1 class2')
  })

  it('should handle object syntax', () => {
    const result = cn({
      'active-class': true,
      'inactive-class': false,
    })
    expect(result).toBe('active-class')
  })
})

describe('formatCurrency helper', () => {
  // Inline helper for testing
  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

  it('should format USD correctly', () => {
    expect(formatCurrency(100)).toBe('$100.00')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('should handle negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-$50.00')
  })

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00')
    expect(formatCurrency(10.994)).toBe('$10.99')
  })
})

describe('formatDate helper', () => {
  const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) =>
    new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(
      new Date(date)
    )

  it('should format date correctly', () => {
    const date = new Date('2024-12-04T12:00:00Z')
    const result = formatDate(date, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    expect(result).toMatch(/Dec/)
    expect(result).toMatch(/2024/)
  })

  it('should handle string dates', () => {
    const result = formatDate('2024-01-15T12:00:00Z', {
      month: 'long',
      day: 'numeric',
    })
    expect(result).toMatch(/January/)
  })
})

describe('validation helpers', () => {
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const isValidPhone = (phone: string) =>
    /^[\d\s\-\(\)\+]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10

  it('should validate emails correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('@nodomain.com')).toBe(false)
  })

  it('should validate phone numbers correctly', () => {
    expect(isValidPhone('1234567890')).toBe(true)
    expect(isValidPhone('(123) 456-7890')).toBe(true)
    expect(isValidPhone('+1 234 567 8901')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('abcdefghij')).toBe(false)
  })
})

describe('string helpers', () => {
  const truncate = (str: string, maxLength: number) =>
    str.length > maxLength ? `${str.slice(0, maxLength)}...` : str

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  it('should truncate strings correctly', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
    expect(truncate('Hi', 10)).toBe('Hi')
    expect(truncate('Exactly10!', 10)).toBe('Exactly10!')
  })

  it('should capitalize strings correctly', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('WORLD')).toBe('World')
    expect(capitalize('tEST')).toBe('Test')
  })

  it('should slugify strings correctly', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('Test & Demo!')).toBe('test-demo')
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
  })
})
