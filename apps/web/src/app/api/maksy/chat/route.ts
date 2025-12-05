import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  subscriptions,
  companies,
  customers,
  jobs,
  invoices,
  tasks,
} from '@/db/schema'
import { eq, count, sum, and, gte, desc } from 'drizzle-orm'
import { z } from 'zod'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().uuid().optional(),
})

/**
 * POST /api/maksy/chat
 * Chat with Maksy AI assistant
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request
    const { message, conversationId } = chatSchema.parse(body)

    // Check subscription for AI access
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, context.companyId),
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      )
    }

    // Get company context for AI
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, context.companyId),
    })

    // Get business stats for context
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [customerStats] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.companyId, context.companyId))

    const [jobStats] = await db
      .select({
        total: count(),
        completed: count(),
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.companyId, context.companyId),
          gte(jobs.scheduledDate, startOfMonth.toISOString().split('T')[0])
        )
      )

    const [invoiceStats] = await db
      .select({
        total: count(),
        revenue: sum(invoices.amountPaid),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, context.companyId),
          gte(invoices.issueDate, startOfMonth.toISOString().split('T')[0])
        )
      )

    const [taskStats] = await db
      .select({
        pending: count(),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.companyId, context.companyId),
          eq(tasks.status, 'incomplete')
        )
      )

    // Build system prompt with business context
    const systemPrompt = `You are Maksy, an AI assistant for ${company?.companyName || 'this service business'}. 
You help business owners manage their service business, including customers, jobs, invoices, estimates, and team.

Current Business Context:
- Company: ${company?.companyName || 'Unknown'}
- Industry: ${company?.industry || 'Service Business'}
- Total Customers: ${customerStats.count}
- Jobs This Month: ${jobStats.total}
- Revenue This Month: $${parseFloat(invoiceStats.revenue || '0').toLocaleString()}
- Pending Tasks: ${taskStats.pending}
- Subscription Plan: ${subscription.planType}

Guidelines:
1. Be helpful, concise, and professional
2. Provide actionable advice specific to service businesses
3. When discussing finances, be encouraging but realistic
4. Suggest features they can use in Maksy to solve their problems
5. If asked about features not available, let them know it's coming soon
6. Never make up data - only reference the context provided
7. Keep responses under 200 words unless more detail is requested

You can help with:
- Business insights and recommendations
- Scheduling and job management tips
- Customer communication advice
- Pricing and estimate strategies
- Invoice and payment best practices
- Team management suggestions
- General business questions`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiResponse =
      completion.choices[0]?.message?.content ||
      'I apologize, but I was unable to generate a response. Please try again.'

    // TODO: Store conversation in database for history
    // TODO: Track AI usage for billing

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: conversationId || crypto.randomUUID(),
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    })
  } catch (error: any) {
    console.error('Error in Maksy chat:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
