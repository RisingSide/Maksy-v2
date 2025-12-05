import { notFound } from 'next/navigation'
import { db } from '@/db/index.server'
import { customForms, companies } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { PublicFormClient } from './client'
import { Metadata } from 'next'

interface PublicFormPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PublicFormPageProps): Promise<Metadata> {
  const { id } = await params

  const form = await db.query.customForms.findFirst({
    where: eq(customForms.id, id),
  })

  if (!form) {
    return { title: 'Form Not Found' }
  }

  return {
    title: form.formTitle,
    description: form.formDescription || `Submit the ${form.formTitle} form`,
  }
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { id } = await params

  // Fetch form
  const form = await db.query.customForms.findFirst({
    where: and(eq(customForms.id, id), eq(customForms.isActive, true)),
  })

  if (!form) {
    notFound()
  }

  // Fetch company info
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, form.companyId),
    columns: {
      companyName: true,
      logoUrl: true,
    },
  })

  return (
    <PublicFormClient
      form={{
        id: form.id,
        formTitle: form.formTitle,
        formDescription: form.formDescription,
        submitButtonText: form.submitButtonText,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl || null,
        fieldsConfig: form.fieldsConfig as Array<{
          id: string
          type: string
          label: string
          placeholder?: string
          required?: boolean
          options?: string[]
        }>,
      }}
      company={{
        name: company?.companyName || 'Company',
        logoUrl: company?.logoUrl || null,
      }}
    />
  )
}
