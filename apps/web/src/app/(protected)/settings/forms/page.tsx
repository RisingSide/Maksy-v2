import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customForms, formSubmissions } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { FormsSettingsClient } from './client'

export default async function FormsSettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  // Fetch forms with submission counts
  const forms = await db
    .select({
      id: customForms.id,
      formName: customForms.formName,
      formTitle: customForms.formTitle,
      formDescription: customForms.formDescription,
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

  return (
    <FormsSettingsClient
      forms={forms.map((f) => ({
        id: f.id,
        formName: f.formName,
        formTitle: f.formTitle,
        formDescription: f.formDescription,
        isActive: f.isActive,
        createdAt: f.createdAt.toISOString(),
        submissionCount: Number(f.submissionCount) || 0,
      }))}
      planType={context.planType}
    />
  )
}
