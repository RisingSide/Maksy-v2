import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { documents } from '@/db/schema'
import { eq, and, like, inArray, desc, count } from 'drizzle-orm'

/**
 * GET /api/documents
 * List all documents for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    // Authenticate and get company context
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('folder_path') // No default - null if not provided
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const linkedEntityType = searchParams.get('linked_entity_type')
    const linkedEntityId = searchParams.get('linked_entity_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const whereConditions = [eq(documents.companyId, context.companyId)]

    // Only filter by folder path if explicitly provided
    if (folderPath) {
      whereConditions.push(like(documents.folderPath, `${folderPath}%`))
    }

    if (linkedEntityId && linkedEntityType === 'customer') {
      whereConditions.push(eq(documents.linkedCustomerId, linkedEntityId))
    } else if (linkedEntityId && linkedEntityType === 'job') {
      whereConditions.push(eq(documents.linkedJobId, linkedEntityId))
    } else if (linkedEntityId && linkedEntityType === 'invoice') {
      whereConditions.push(eq(documents.linkedInvoiceId, linkedEntityId))
    }

    // Build where clause
    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Execute paginated query and count query in parallel
    const [results, countResult] = await Promise.all([
      // Paginated data query
      db.query.documents.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(documents.uploadedAt)],
      }),
      // Total count query (without pagination)
      db.select({ count: count() }).from(documents).where(whereClause),
    ])

    const total = countResult[0]?.count ?? 0

    // TODO: Add search functionality using extractedText
    // TODO: Add tag filtering

    return NextResponse.json({
      documents: results,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * Upload new document(s)
 */
export async function POST(request: Request) {
  try {
    // Authenticate and get company context
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check plan limits (Team: 100 docs, 10MB files; Pro: 500 docs, 25MB files; Scale: unlimited)
    // TODO: Parse FormData
    // TODO: Validate file types and sizes
    // TODO: Upload to Supabase Storage (bucket: documents)
    // TODO: Insert document records with companyId filter
    // TODO: Queue OCR job if Pro/Scale
    // TODO: Queue AI smart linking if Scale
    // TODO: Log activity
    // TODO: Return document IDs

    return NextResponse.json(
      {
        message: 'Upload documents - Coming Soon (Auth working)',
        companyId: context.companyId,
        userId: context.userId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading documents:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    )
  }
}
