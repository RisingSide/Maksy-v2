/**
 * Slug Availability Checker
 *
 * Checks if a booking page slug is available and suggests alternatives if taken.
 *
 * Validation Rules:
 * - Min 3 chars, max 50 chars
 * - Lowercase letters, numbers, hyphens only
 * - Cannot start or end with hyphen
 * - Regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { companies } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MIN_LENGTH = 3
const MAX_LENGTH = 50

export async function GET(request: NextRequest) {
  // Declare slug outside try block so it's accessible in catch block
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const excludeCompanyId = searchParams.get('exclude_company_id') // For updates

  try {
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Validate slug format
    const validation = validateSlug(slug)
    if (!validation.valid) {
      return NextResponse.json(
        {
          available: false,
          slug,
          error: validation.error,
        },
        { status: 400 }
      )
    }

    // Check if slug is already taken using Drizzle
    const existingCompany = await db.query.companies.findFirst({
      where: excludeCompanyId
        ? and(eq(companies.slug, slug), ne(companies.id, excludeCompanyId))
        : eq(companies.slug, slug),
      columns: {
        id: true,
        slug: true,
      },
    })

    // Slug is available if no company found
    if (!existingCompany) {
      return NextResponse.json({
        available: true,
        slug,
      })
    }

    // Slug is taken, generate suggestion
    const suggestion = generateSlugSuggestion(slug)

    return NextResponse.json({
      available: false,
      slug,
      suggestion,
    })
  } catch (error) {
    console.error('Slug check error:', error)
    // If database is unavailable, assume slug is available to not block onboarding
    // The actual uniqueness will be enforced at insert time
    // Only return slug in response if it was provided
    const response: any = {
      available: true,
      warning: 'Could not verify slug availability. Will be validated on save.',
    }

    if (slug) {
      response.slug = slug
    }

    return NextResponse.json(response)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateSlug(slug: string): { valid: boolean; error?: string } {
  // Check length
  if (slug.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Slug must be at least ${MIN_LENGTH} characters`,
    }
  }

  if (slug.length > MAX_LENGTH) {
    return {
      valid: false,
      error: `Slug must be no more than ${MAX_LENGTH} characters`,
    }
  }

  // Check format
  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        'Slug can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.',
    }
  }

  // Check for reserved slugs
  const RESERVED_SLUGS = [
    'admin',
    'api',
    'app',
    'www',
    'mail',
    'support',
    'help',
    'docs',
    'blog',
    'about',
    'pricing',
    'login',
    'signup',
    'settings',
    'dashboard',
  ]

  if (RESERVED_SLUGS.includes(slug)) {
    return {
      valid: false,
      error: 'This slug is reserved and cannot be used',
    }
  }

  return { valid: true }
}

function generateSlugSuggestion(baseSlug: string): string {
  // Generate a random 4-character alphanumeric string
  const random = Math.random().toString(36).substring(2, 6)
  return `${baseSlug}-${random}`
}

// Helper function moved to internal scope to avoid Next.js route export conflicts
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, MAX_LENGTH)
}
