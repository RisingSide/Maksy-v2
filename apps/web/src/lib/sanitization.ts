/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses a simple regex-based approach for server-side compatibility
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''

  // Remove script tags and their contents
  let clean = dirty.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )

  // Remove event handlers
  clean = clean.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')

  // Remove javascript: URLs
  clean = clean.replace(/javascript:/gi, '')

  // Remove data: URLs (potential XSS vector)
  clean = clean.replace(/data:/gi, '')

  return clean
}

/**
 * Sanitize user input for database storage
 * Removes any HTML tags and trims whitespace
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''

  // Remove all HTML tags
  const textOnly = input.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  const decoded = textOnly
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')

  // Re-escape for safety
  const escaped = decoded.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Trim whitespace
  return escaped.trim()
}

/**
 * Sanitize text without HTML escaping (for plain text fields)
 */
export function sanitizePlainText(input: string): string {
  if (!input) return ''

  // Remove all HTML tags
  const textOnly = input.replace(/<[^>]*>/g, '')

  // Trim whitespace
  return textOnly.trim()
}

/**
 * Sanitize and validate email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  const sanitized = email.toLowerCase().trim()

  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized
}

/**
 * Sanitize phone numbers
 * Removes all non-numeric characters except + for international codes
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''

  // Keep only digits and + symbol
  return phone.replace(/[^+\d]/g, '')
}

/**
 * Sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol')
    }

    return parsed.toString()
  } catch {
    throw new Error('Invalid URL format')
  }
}

/**
 * Sanitize file names
 * Removes special characters that could cause issues
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return ''

  // Remove path traversal attempts
  let safe = fileName.replace(/\.\./g, '')

  // Remove special characters except dots, dashes, and underscores
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Ensure it doesn't start with a dot (hidden file)
  if (safe.startsWith('.')) {
    safe = '_' + safe.slice(1)
  }

  return safe
}

/**
 * Sanitize JSON data
 * Recursively sanitizes all string values in an object
 */
export function sanitizeJson<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizePlainText(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizePlainText(item) : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeJson(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Prevent SQL injection by validating sort columns
 */
export function sanitizeSortColumn(
  column: string,
  allowedColumns: string[]
): string {
  if (!allowedColumns.includes(column)) {
    throw new Error(`Invalid sort column: ${column}`)
  }
  return column
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePagination(params: {
  page?: string | number
  limit?: string | number
}): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(params.page || 1), 10))
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(params.limit || 20), 10))
  )

  return { page, limit }
}
