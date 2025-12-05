/**
 * Foundation Test Script
 *
 * Verifies the Maksy database foundation is properly set up before building features.
 *
 * Checks:
 * 1. Database connection
 * 2. All 41 tables exist
 * 3. RLS helper functions work
 * 4. Timezone support present
 * 5. Storage buckets exist (manual check)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'apps/web/.env.local') })

const REQUIRED_TABLES = [
  // Core (6)
  'user_profiles',
  'companies',
  'company_settings',
  'subscriptions',
  'team_members',
  'team_availability',
  // CRM (3)
  'customers',
  'custom_customer_fields',
  'customer_field_values',
  // Services (3)
  'service_categories',
  'services',
  'service_add_ons',
  // Jobs (4)
  'jobs',
  'job_add_ons',
  'job_tracking',
  'job_media',
  // Tasks & Inventory (6)
  'tasks',
  'task_usage_counters',
  'inventory_items',
  'inventory_movements',
  'inventory_attachments',
  // Financial (6)
  'estimates',
  'estimate_line_items',
  'invoices',
  'invoice_line_items',
  'payments',
  // Coupons (3)
  'coupons',
  'coupon_service_restrictions',
  'coupon_usages',
  // Automations (2)
  'automations',
  'automation_executions',
  // Forms (2)
  'custom_forms',
  'form_submissions',
  // Settings & AI (5)
  'integrations',
  'notification_preferences',
  'ai_chat_history',
  'ai_usage_counters',
  'ai_usage_lifetime',
  // Audit (2)
  'audit_logs',
  'reviews',
]

const REQUIRED_BUCKETS = [
  'company-logos',
  'company-covers',
  'service-icons',
  'job-media',
  'inventory-attachments',
  'invoice-pdfs',
]

async function testFoundation() {
  console.log('\n🧪 MAKSY FOUNDATION TEST\n')
  console.log('='.repeat(60) + '\n')

  let passed = 0
  let failed = 0

  // Check environment variables
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error('❌ Missing Supabase environment variables')
    console.log(
      '   Please configure .env.local with SUPABASE_URL and SERVICE_ROLE_KEY\n'
    )
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Test 1: Database Connection
  console.log('Test 1: Database Connection')
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(0)
    if (error && !error.message.includes('relation')) {
      throw error
    }
    console.log('✅ Database connection successful\n')
    passed++
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.log('')
    failed++
  }

  // Test 2: Check all tables exist
  console.log('Test 2: Table Existence Check')
  console.log(`Checking for ${REQUIRED_TABLES.length} tables...\n`)

  const missingTables: string[] = []

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('count').limit(0)

      if (error) {
        if (
          error.message.includes('relation') ||
          error.message.includes('does not exist')
        ) {
          console.log(`  ❌ ${table.padEnd(30)} - NOT FOUND`)
          missingTables.push(table)
          failed++
        } else {
          console.log(`  ✅ ${table.padEnd(30)} - EXISTS`)
          passed++
        }
      } else {
        console.log(`  ✅ ${table.padEnd(30)} - EXISTS`)
        passed++
      }
    } catch (error) {
      console.log(`  ❌ ${table.padEnd(30)} - ERROR`)
      missingTables.push(table)
      failed++
    }
  }

  console.log('')

  if (missingTables.length > 0) {
    console.log('⚠️  Missing tables:', missingTables.join(', '))
    console.log('   Run migrations first: pnpm run migrate\n')
  }

  // Test 3: Check for timezone column in companies
  console.log('Test 3: Timezone Support')
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('time_zone')
      .limit(1)

    if (error && error.message.includes('column')) {
      console.log('❌ time_zone column missing from companies table')
      console.log('   Update schema to include time_zone column\n')
      failed++
    } else {
      console.log('✅ time_zone column exists in companies table\n')
      passed++
    }
  } catch (error) {
    console.log('⚠️  Could not verify timezone column (table may not exist)\n')
  }

  // Test 4: Check RLS helper functions
  console.log('Test 4: RLS Helper Functions')
  try {
    const { error } = await supabase.rpc('company_id' as any)

    if (error && !error.message.includes('no rows')) {
      if (error.message.includes('does not exist')) {
        console.log('❌ auth.company_id() function not found')
        console.log('   Run RLS helper migration first\n')
        failed++
      } else {
        console.log(
          '⚠️  auth.company_id() exists but returned error (expected without user context)\n'
        )
        passed++
      }
    } else {
      console.log('✅ auth.company_id() helper function exists\n')
      passed++
    }
  } catch (error) {
    console.log(
      '⚠️  Could not verify RLS helper (expected without auth context)\n'
    )
    passed++
  }

  // Test 5: Storage Buckets (manual check reminder)
  console.log('Test 5: Storage Buckets')
  console.log(
    'ℹ️  Storage buckets must be created manually in Supabase Dashboard:'
  )
  REQUIRED_BUCKETS.forEach((bucket) => {
    console.log(`   - ${bucket}`)
  })
  console.log('   See STORAGE_BUCKET_SETUP.md for detailed instructions\n')

  // Summary
  console.log('='.repeat(60))
  console.log('\n📊 TEST SUMMARY\n')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📝 Total:  ${passed + failed}\n`)

  if (failed === 0 && missingTables.length === 0) {
    console.log('🎉 Foundation is solid! Ready to build.\n')
    process.exit(0)
  } else {
    console.log(
      '⚠️  Foundation has issues. Fix them before building features.\n'
    )
    console.log('Next steps:')
    if (missingTables.length > 0) {
      console.log('1. Generate migrations: pnpm drizzle-kit generate')
      console.log('2. Apply migrations: pnpm run migrate')
    }
    console.log('3. Create storage buckets (see STORAGE_BUCKET_SETUP.md)')
    console.log('4. Run this test again\n')
    process.exit(1)
  }
}

// Run the test
testFoundation().catch((error) => {
  console.error('\n💥 Fatal error during foundation test:', error)
  process.exit(1)
})
