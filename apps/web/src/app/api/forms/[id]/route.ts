import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customForms, formSubmissions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateFormSchema = z.object({
  formName: z.string().min(1).max(100).optional(),
  formTitle: z.string().min(1).max(200).optional(),
  formDescription: z.string().max(500).nullable().optional(),
  submitButtonText: z.string().max(50).optional(),
  successMessage: z.string().max(500).optional(),
  redirectUrl: z.string().url().nullable().optional(),
  notificationEmail: z.string().email().nullable().optional(),
  fieldsConfig: z
    .array(
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
    )
    .optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/forms/[id]
 * Get a single form
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const form = await db.query.customForms.findFirst({
      where: and(
        eq(customForms.id, id),
        eq(customForms.companyId, context.companyId)
      ),
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

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
      },
    })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

/**
 * PATCH /api/forms/[id]
 * Update a form
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateFormSchema.parse(body)

    // Verify form belongs to company
    const existingForm = await db.query.customForms.findFirst({
      where: and(
        eq(customForms.id, id),
        eq(customForms.companyId, context.companyId)
      ),
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.formName !== undefined) {
      updateData.formName = validatedData.formName
    }
    if (validatedData.formTitle !== undefined) {
      updateData.formTitle = validatedData.formTitle
    }
    if (validatedData.formDescription !== undefined) {
      updateData.formDescription = validatedData.formDescription
    }
    if (validatedData.submitButtonText !== undefined) {
      updateData.submitButtonText = validatedData.submitButtonText
    }
    if (validatedData.successMessage !== undefined) {
      updateData.successMessage = validatedData.successMessage
    }
    if (validatedData.redirectUrl !== undefined) {
      updateData.redirectUrl = validatedData.redirectUrl
    }
    if (validatedData.notificationEmail !== undefined) {
      updateData.notificationEmail = validatedData.notificationEmail
    }
    if (validatedData.fieldsConfig !== undefined) {
      updateData.fieldsConfig = validatedData.fieldsConfig
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive
    }

    const [updatedForm] = await db
      .update(customForms)
      .set(updateData)
      .where(eq(customForms.id, id))
      .returning()

    return NextResponse.json({
      form: {
        id: updatedForm.id,
        formName: updatedForm.formName,
        formTitle: updatedForm.formTitle,
        formDescription: updatedForm.formDescription,
        submitButtonText: updatedForm.submitButtonText,
        successMessage: updatedForm.successMessage,
        redirectUrl: updatedForm.redirectUrl,
        notificationEmail: updatedForm.notificationEmail,
        fieldsConfig: updatedForm.fieldsConfig,
        isActive: updatedForm.isActive,
        createdAt: updatedForm.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating form:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forms/[id]
 * Delete a form and all submissions
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify form belongs to company
    const existingForm = await db.query.customForms.findFirst({
      where: and(
        eq(customForms.id, id),
        eq(customForms.companyId, context.companyId)
      ),
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Delete submissions first
    await db.delete(formSubmissions).where(eq(formSubmissions.formId, id))

    // Delete form
    await db.delete(customForms).where(eq(customForms.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
