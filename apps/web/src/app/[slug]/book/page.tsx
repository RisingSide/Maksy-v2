import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/db/index.server'
import { companies, services, companySettings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { BookingPageClient } from './client'

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { slug } = await params

  const company = await db.query.companies.findFirst({
    where: eq(companies.slug, slug),
    columns: {
      companyName: true,
      industry: true,
    },
  })

  if (!company) {
    return {
      title: 'Company Not Found',
    }
  }

  return {
    title: `Book with ${company.companyName} | Maksy`,
    description: `Schedule your appointment with ${company.companyName}. Easy online booking for ${company.industry || 'professional services'}.`,
    openGraph: {
      title: `Book with ${company.companyName}`,
      description: `Schedule your appointment with ${company.companyName}`,
    },
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params

  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.slug, slug),
  })

  if (!company) {
    notFound()
  }

  // Get company settings (for business hours, etc.)
  const settings = await db.query.companySettings.findFirst({
    where: eq(companySettings.companyId, company.id),
  })

  // Get active public services
  const availableServices = await db
    .select()
    .from(services)
    .where(and(eq(services.companyId, company.id), eq(services.isPublic, true)))
    .orderBy(services.sortOrder)

  // Parse business hours from settings
  // Note: businessHours field needs to be added to company_settings schema
  // For now, use default business hours
  const defaultBusinessHours: Record<
    string,
    { open: string; close: string; enabled: boolean }
  > = {
    monday: { open: '09:00', close: '17:00', enabled: true },
    tuesday: { open: '09:00', close: '17:00', enabled: true },
    wednesday: { open: '09:00', close: '17:00', enabled: true },
    thursday: { open: '09:00', close: '17:00', enabled: true },
    friday: { open: '09:00', close: '17:00', enabled: true },
    saturday: { open: '09:00', close: '17:00', enabled: false },
    sunday: { open: '09:00', close: '17:00', enabled: false },
  }
  const businessHours = defaultBusinessHours

  return (
    <BookingPageClient
      company={{
        id: company.id,
        name: company.companyName,
        slug: company.slug,
        logoUrl: company.logoUrl,
        coverPhotoUrl: company.coverPhotoUrl,
        industry: company.industry,
        phone: company.businessPhone,
        email: company.businessEmail,
        address: company.addressLine1
          ? {
              line1: company.addressLine1,
              line2: company.addressLine2,
              city: company.city,
              state: company.state,
              zip: company.zipCode,
            }
          : null,
        timeZone: company.timeZone,
      }}
      services={availableServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: parseFloat(s.price?.toString() || '0'),
        durationMinutes: s.durationMinutes,
        color: s.color,
      }))}
      businessHours={businessHours}
    />
  )
}
