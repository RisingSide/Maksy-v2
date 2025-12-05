import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { contracts } from '@/db/schema'
import { eq, and, or, like, desc, count } from 'drizzle-orm'

/**
 * GET /api/contracts
 * List all contracts for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = context
    const { searchParams } = new URL(request.url)

    // Parse query params
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const whereConditions = [eq(contracts.companyId, companyId)]

    if (status) {
      whereConditions.push(eq(contracts.status, status as any))
    }

    if (customerId) {
      whereConditions.push(eq(contracts.customerId, customerId))
    }

    if (search) {
      whereConditions.push(
        or(
          like(contracts.title, `%${search}%`),
          like(contracts.contentHtml, `%${search}%`)
        ) as any // SQL type assertion
      )
    }

    // Build where clause once
    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Execute paginated query and count query in parallel
    const [contractsList, countResult] = await Promise.all([
      // Paginated data query
      db.query.contracts.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(contracts.createdAt)],
        with: {
          customer: true,
        },
      }),
      // Total count query (without pagination)
      db.select({ count: count() }).from(contracts).where(whereClause),
    ])

    const total = countResult[0]?.count ?? 0

    return NextResponse.json({
      contracts: contractsList,
      total,
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts
 * Create a new contract
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, userId } = context
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.customerId || !body.contractType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, customerId, contractType' },
        { status: 400 }
      )
    }

    // Create contract
    const [contract] = await db
      .insert(contracts)
      .values({
        companyId,
        customerId: body.customerId,
        createdByUserId: userId,
        title: body.title,
        contractType: body.contractType,
        contentJson: body.contentJson || {},
        contentHtml: body.contentHtml || '',
        status: 'draft',
      })
      .returning()

    return NextResponse.json(
      {
        contract,
        message: 'Contract created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating contract:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
