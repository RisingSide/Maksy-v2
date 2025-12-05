import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customForms } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

const formSchema = z.object({
  formName: z.string().min(1).max(100),
  formTitle: z.string().min(1).max(200),
  formDescription: z.string().max(500).nullable().optional(),
  submitButtonText: z.string().max(50).optional(),
  successMessage: z.string().max(500).optional(),
  redirectUrl: z.string().url().optional().nullable(),
  notificationEmail: z.string().email().optional().nullable(),
  fieldsConfig: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        'text',
        'email',
        'phone',
        'number',
        'textarea',
        'dropdown',
        'checkbox',
        'date',
      ]),
      label: z.string(),
      placeholder: z.string().optional(),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
    })
  ),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/forms
 * List all forms for the company
 */
export async function GET() {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forms = await db
      .select({
        id: customForms.id,
        formName: customForms.formName,
        formTitle: customForms.formTitle,
        formDescription: customForms.formDescription,
        submitButtonText: customForms.submitButtonText,
        successMessage: customForms.successMessage,
        redirectUrl: customForms.redirectUrl,
        notificationEmail: customForms.notificationEmail,
        fieldsConfig: customForms.fieldsConfig,
        isActive: customForms.isActive,
        createdAt: customForms.createdAt,
        submissionCount: sql<number>`(
          SELECT COUNT(*) FROM form_submissions 
          WHERE form_submissions.form_id = ${customForms.id}
        )`,
      })
      .from(customForms)
      .where(eq(customForms.companyId, context.companyId))
      .orderBy(desc(customForms.createdAt))

    return NextResponse.json({
      forms: forms.map((f) => ({
        ...f,
        submissionCount: Number(f.submissionCount) || 0,
        createdAt: f.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/forms
 * Create a new form
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check plan limits
    const existingForms = await db
      .select({ count: sql<number>`count(*)` })
      .from(customForms)
      .where(eq(customForms.companyId, context.companyId))

    const formCount = Number(existingForms[0]?.count) || 0
    const formLimit = context.planType === 'scale' ? Infinity : 1

    if (formCount >= formLimit) {
      return NextResponse.json(
        { error: 'Form limit reached. Upgrade to Scale for unlimited forms.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = formSchema.parse(body)

    const [form] = await db
      .insert(customForms)
      .values({
        companyId: context.companyId,
        formName: validatedData.formName,
        formTitle: validatedData.formTitle,
        formDescription: validatedData.formDescription || null,
        submitButtonText: validatedData.submitButtonText || 'Submit',
        successMessage:
          validatedData.successMessage || 'Thank you for your submission!',
        redirectUrl: validatedData.redirectUrl || null,
        notificationEmail: validatedData.notificationEmail || null,
        fieldsConfig: validatedData.fieldsConfig,
        isActive: validatedData.isActive ?? true,
      })
      .returning()

    return NextResponse.json({
      form: {
        id: form.id,
        formName: form.formName,
        formTitle: form.formTitle,
        formDescription: form.formDescription,
        submitButtonText: form.submitButtonText,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl,
        notificationEmail: form.notificationEmail,
        fieldsConfig: form.fieldsConfig,
        isActive: form.isActive,
        createdAt: form.createdAt.toISOString(),
        submissionCount: 0,
      },
    })
  } catch (error) {
    console.error('Error creating form:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    )
  }
}
