// Flat config for Next 16 + TS
import next from 'eslint-config-next'

export default [
  ...next,

  // Global rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // keep SDKs behind wrappers everywhere by default
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'openai', message: 'Use "@/lib/ai" instead.' },
          { name: 'stripe', message: 'Use "@/lib/stripe" instead.' },
          { name: 'twilio', message: 'Use "@/lib/sms" instead.' },
          { name: '@supabase/supabase-js', message: 'Use "@/lib/supabaseClient" or "@/lib/supabaseAdmin".' },
        ],
      }],
      // relax TypeScript strictness for CI
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Allow SDK imports inside our wrappers
  { files: ['src/lib/ai.ts'], rules: { 'no-restricted-imports': 'off' } },
  { files: ['src/lib/stripe.ts'], rules: { 'no-restricted-imports': 'off' } },
  { files: ['src/lib/sms.ts'], rules: { 'no-restricted-imports': 'off' } },
  { files: ['src/lib/supabaseClient.ts', 'src/lib/supabaseAdmin.ts'], rules: { 'no-restricted-imports': 'off' } },

  // Also allow type-only Stripe import in the webhook (if present)
  { files: ['src/app/api/stripe/webhook/route.ts'], rules: { 'no-restricted-imports': 'off' } },
]
