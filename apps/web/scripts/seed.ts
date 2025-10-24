import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function run() {
  await supabaseAdmin.from('organizations').insert([
    { name: 'Demo Org', plan: 'free', subscription_status: 'active' },
  ])
  console.log('✅ Demo data inserted')
}

run()
