/**
 * Clerk Authentication Helpers for API Routes
 *
 * These helpers provide a consistent way to:
 * 1. Authenticate users via Clerk
 * 2. Get their company_id from team_members table
 * 3. Check permissions (owner, admin, member)
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import { teamMembers, companies, subscriptions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export interface AuthContext {
  userId: string
  companyId: string
  companyName: string
  role: 'owner' | 'admin' | 'team_member'
  planType: 'pro' | 'scale' | 'team'
  email: string
  firstName: string
  lastName: string
  /** Full name of the user (firstName + lastName) */
  userName: string
}

/**
 * Get authenticated user and their company context
 * Use this at the start of every protected API route
 *
 * Returns null if:
 * - User is not authenticated
 * - User has no company yet (new user, webhook hasn't fired)
 * - User has no subscription yet
 *
 * @returns {Promise<AuthContext | null>} User and company information, or null
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    // Get Clerk user ID
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    // Get user details from Clerk
    const user = await currentUser()

    if (!user || !user.emailAddresses[0]) {
      return null
    }

    // Get team member record (includes company_id and role)
    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    })

    if (!teamMember) {
      // New user - no company yet (webhook may not have fired)
      return null
    }

    // Get subscription plan
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, teamMember.companyId),
    })

    if (!subscription) {
      // No subscription yet - this shouldn't happen but handle gracefully
      return null
    }

    // Get company details
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, teamMember.companyId),
      columns: {
        companyName: true,
      },
    })

    const firstName = user.firstName || ''
    const lastName = user.lastName || ''

    return {
      userId,
      companyId: teamMember.companyId,
      companyName: company?.companyName || 'Your Company',
      role: teamMember.role,
      planType: subscription.planType,
      email: user.emailAddresses[0].emailAddress,
      firstName,
      lastName,
      userName: [firstName, lastName].filter(Boolean).join(' ') || 'Team Admin',
    }
  } catch (error) {
    console.error('Error in getAuthContext:', error)
    return null
  }
}

/**
 * Get authenticated user context, throwing errors for unauthorized access
 * Use this when you need to enforce authentication (not for new user flows)
 *
 * @throws {Error} If user is not authenticated or has no company
 * @returns {Promise<AuthContext>} User and company information
 */
export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext()

  if (!context) {
    throw new Error('Unauthorized')
  }

  return context
}

/**
 * Check if user has permission for an action
 *
 * @param context - Auth context from getAuthContext()
 * @param requiredRole - Minimum role required ('owner', 'admin', or 'team_member')
 * @returns {boolean} True if user has permission
 */
export function hasPermission(
  context: AuthContext,
  requiredRole: 'owner' | 'admin' | 'team_member'
): boolean {
  const roleHierarchy = {
    owner: 3,
    admin: 2,
    team_member: 1,
  }

  return roleHierarchy[context.role] >= roleHierarchy[requiredRole]
}

/**
 * Verify user belongs to a specific company
 * Use this when the API route includes a company_id parameter
 *
 * @param context - Auth context from getAuthContext()
 * @param requestedCompanyId - Company ID from the request
 * @throws {Error} If user doesn't belong to the company
 */
export function verifyCompanyAccess(
  context: AuthContext,
  requestedCompanyId: string
): void {
  if (context.companyId !== requestedCompanyId) {
    throw new Error('Forbidden: Access denied to this company')
  }
}

/**
 * Get company ID for the authenticated user
 * Lightweight version of getAuthContext when you only need company_id
 *
 * @returns {Promise<string | null>} Company ID or null if not found
 */
export async function getCompanyId(): Promise<string | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
      columns: {
        companyId: true,
      },
    })

    if (!teamMember) {
      return null
    }

    return teamMember.companyId
  } catch (error) {
    console.error('Error in getCompanyId:', error)
    return null
  }
}

/**
 * Check if the current user is authenticated (has a valid Clerk session)
 * Does NOT check if they have a company - use for routes that don't need company context
 */
export async function isAuthenticated(): Promise<{
  authenticated: boolean
  userId: string | null
}> {
  try {
    const { userId } = await auth()
    return { authenticated: !!userId, userId }
  } catch {
    return { authenticated: false, userId: null }
  }
}
