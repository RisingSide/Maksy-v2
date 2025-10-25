import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  plan: text('plan'),
  subscriptionStatus: text('subscription_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fullName: text('full_name'),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: text('status').default('scheduled'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
