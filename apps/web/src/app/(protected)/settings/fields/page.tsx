import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { customCustomerFields } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { CustomerFieldsClient } from './client'

export default async function CustomerFieldsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  // Fetch custom fields for this company
  const fields = await db
    .select()
    .from(customCustomerFields)
    .where(eq(customCustomerFields.companyId, context.companyId))
    .orderBy(asc(customCustomerFields.sortOrder))

  return (
    <CustomerFieldsClient
      fields={fields.map((f) => ({
        id: f.id,
        fieldName: f.fieldName,
        fieldSlug: f.fieldSlug,
        fieldType: f.fieldType as
          | 'text'
          | 'number'
          | 'date'
          | 'dropdown'
          | 'checkbox'
          | 'textarea',
        dropdownOptions: f.dropdownOptions,
        isRequired: f.isRequired,
        showOnBookingPage: f.showOnBookingPage,
        sortOrder: f.sortOrder,
      }))}
      planType={context.planType}
    />
  )
}
