module.exports = {
  extends: ['next', 'next/core-web-vitals'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'openai', message: 'Use "@/lib/ai" instead.' },
        { name: 'stripe', message: 'Use "@/lib/stripe" instead.' },
        { name: 'twilio', message: 'Use "@/lib/sms" instead.' },
        { name: '@supabase/supabase-js', message: 'Use "@/lib/supabaseClient" or "@/lib/supabaseAdmin".' },
      ],
    }],
    // 👇 fully relax TS rules for CI
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
}
