/**
 * Storage Bucket Helpers
 *
 * Enforces consistent path conventions for Supabase Storage buckets.
 * These conventions are critical for RLS policies to work correctly.
 *
 * Path Structure:
 * - Job Media: {companyId}/{jobId}/{filename}
 * - Inventory: {companyId}/{itemId}/{filename}
 * - Company Assets: {companyId}/{assetType}/{filename}
 */

export const STORAGE_BUCKETS = {
  COMPANY_LOGOS: 'company-logos',
  COMPANY_COVERS: 'company-covers',
  SERVICE_ICONS: 'service-icons',
  JOB_MEDIA: 'job-media',
  INVENTORY_ATTACHMENTS: 'inventory-attachments',
  INVOICE_PDFS: 'invoice-pdfs',
} as const

export const MAX_FILE_SIZES = {
  LOGO: 2 * 1024 * 1024, // 2MB
  COVER: 5 * 1024 * 1024, // 5MB
  ICON: 1 * 1024 * 1024, // 1MB
  JOB_MEDIA: 10 * 1024 * 1024, // 10MB
  INVENTORY: 10 * 1024 * 1024, // 10MB
  INVOICE: 5 * 1024 * 1024, // 5MB
} as const

export const ALLOWED_MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
  DOCUMENTS: ['application/pdf'],
  SVG: ['image/svg+xml'],
} as const

/**
 * Generate path for job media files
 * Example: "abc-123-def/job-456/before-1.jpg"
 */
export function getJobMediaPath(
  companyId: string,
  jobId: string,
  filename: string
): string {
  return `${companyId}/${jobId}/${filename}`
}

/**
 * Generate path for inventory attachment files
 * Example: "abc-123-def/item-789/receipt.pdf"
 */
export function getInventoryAttachmentPath(
  companyId: string,
  itemId: string,
  filename: string
): string {
  return `${companyId}/${itemId}/${filename}`
}

/**
 * Generate path for company asset files (logo, cover)
 * Example: "abc-123-def/logo/logo.png"
 */
export function getCompanyAssetPath(
  companyId: string,
  assetType: 'logo' | 'cover',
  filename: string
): string {
  return `${companyId}/${assetType}/${filename}`
}

/**
 * Generate path for service icon files
 * Example: "abc-123-def/service-456/icon.svg"
 */
export function getServiceIconPath(
  companyId: string,
  serviceId: string,
  filename: string
): string {
  return `${companyId}/${serviceId}/${filename}`
}

/**
 * Generate path for invoice PDF files
 * Example: "abc-123-def/invoice-789/INV-2024-001.pdf"
 */
export function getInvoicePdfPath(
  companyId: string,
  invoiceId: string,
  filename: string
): string {
  return `${companyId}/${invoiceId}/${filename}`
}

/**
 * Extract company ID from storage path
 * All our paths start with {companyId}/...
 */
export function extractCompanyIdFromPath(path: string): string | null {
  const parts = path.split('/')
  return parts[0] || null
}

/**
 * Extract job ID from job media path
 */
export function extractJobIdFromPath(path: string): string | null {
  const parts = path.split('/')
  return parts[1] || null
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number
): { valid: boolean; error?: string } {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    }
  }
  return { valid: true }
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: readonly string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }
  return { valid: true }
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalFilename.split('.').pop()
  const nameWithoutExt = originalFilename.replace(`.${extension}`, '')
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)

  return `${sanitized}-${timestamp}-${random}.${extension}`
}

/**
 * Validate and prepare file for upload
 */
export function validateAndPrepareFile(
  file: File,
  bucket: keyof typeof STORAGE_BUCKETS,
  companyId: string,
  resourceId: string
): {
  valid: boolean
  error?: string
  path?: string
  filename?: string
} {
  // Determine allowed types and max size based on bucket
  let allowedTypes: readonly string[]
  let maxSize: number
  let pathGenerator:
    | ((companyId: string, resourceId: string, filename: string) => string)
    | ((
        companyId: string,
        assetType: 'logo' | 'cover',
        filename: string
      ) => string)

  switch (bucket) {
    case 'COMPANY_LOGOS':
      allowedTypes = ALLOWED_MIME_TYPES.IMAGES
      maxSize = MAX_FILE_SIZES.LOGO
      pathGenerator = getCompanyAssetPath
      resourceId = 'logo'
      break
    case 'COMPANY_COVERS':
      allowedTypes = ALLOWED_MIME_TYPES.IMAGES
      maxSize = MAX_FILE_SIZES.COVER
      pathGenerator = getCompanyAssetPath
      resourceId = 'cover'
      break
    case 'SERVICE_ICONS':
      allowedTypes = [...ALLOWED_MIME_TYPES.IMAGES, ...ALLOWED_MIME_TYPES.SVG]
      maxSize = MAX_FILE_SIZES.ICON
      pathGenerator = getServiceIconPath
      break
    case 'JOB_MEDIA':
      allowedTypes = ALLOWED_MIME_TYPES.IMAGES
      maxSize = MAX_FILE_SIZES.JOB_MEDIA
      pathGenerator = getJobMediaPath
      break
    case 'INVENTORY_ATTACHMENTS':
      allowedTypes = [
        ...ALLOWED_MIME_TYPES.IMAGES,
        ...ALLOWED_MIME_TYPES.DOCUMENTS,
      ]
      maxSize = MAX_FILE_SIZES.INVENTORY
      pathGenerator = getInventoryAttachmentPath
      break
    case 'INVOICE_PDFS':
      allowedTypes = ALLOWED_MIME_TYPES.DOCUMENTS
      maxSize = MAX_FILE_SIZES.INVOICE
      pathGenerator = getInvoicePdfPath
      break
    default:
      return { valid: false, error: 'Invalid bucket type' }
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size, maxSize)
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  // Validate file type
  const typeValidation = validateFileType(file.type, allowedTypes)
  if (!typeValidation.valid) {
    return typeValidation
  }

  // Generate unique filename and path
  const filename = generateUniqueFilename(file.name)
  const path = pathGenerator(companyId, resourceId as any, filename)

  return {
    valid: true,
    path,
    filename,
  }
}
