import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function run() {
  // ⚠️ for dev/demo only
  // find the first profile to attach demo org data
  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('id, default_org_id')
    .limit(1)
    .maybeSingle()
  const orgId = prof?.default_org_id
  if (!orgId) {
    console.log('No profile/default_org_id; skipping seed.')
    return
  }

  await supabaseAdmin
    .from('customers')
    .insert([
      {
        organization_id: orgId,
        full_name: 'Jordan Doe',
        email: 'jordan@example.com',
        phone: '555-0100',
      },
    ])

  await supabaseAdmin
    .from('services')
    .insert([
      {
        organization_id: orgId,
        name: 'Full Detail',
        duration_minutes: 180,
        price_cents: 29900,
      },
    ])

  // naive booking 2h window
  const start = new Date()
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const { data: svc } = await supabaseAdmin
    .from('services')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .single()
  const { data: cust } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .single()

  await supabaseAdmin
    .from('bookings')
    .insert([
      {
        organization_id: orgId,
        customer_id: cust!.id,
        service_id: svc!.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: 'scheduled',
      },
    ])

  console.log('✅ Seed complete')
}
run()
