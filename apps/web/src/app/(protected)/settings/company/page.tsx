import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CompanySettingsClient } from './client'

export default async function CompanySettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return null
  }

  // Get company details
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, context.companyId),
  })

  if (!company) {
    return null
  }

  return (
    <CompanySettingsClient
      company={{
        id: company.id,
        name: company.companyName,
        slug: company.slug,
        industry: company.industry,
        timeZone: company.timeZone,
        phone: company.businessPhone,
        email: company.businessEmail,
        website: company.websiteUrl,
        address: {
          line1: company.addressLine1,
          line2: company.addressLine2,
          city: company.city,
          state: company.state,
          zip: company.zipCode,
          country: company.country,
        },
        logoUrl: company.logoUrl,
        coverPhotoUrl: company.coverPhotoUrl,
        googleReviewLink: company.googleReviewLink,
        facebookUrl: company.facebookUrl,
        instagramUrl: company.instagramUrl,
        twitterUrl: company.twitterUrl,
      }}
      isOwner={context.role === 'owner'}
    />
  )
}
