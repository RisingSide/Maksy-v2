import path from 'path'
import type { NextConfig } from 'next'

export const experimental = {
  // keeps App Router stable
  serverActions: { allowedOrigins: ['*'] },
}

const nextConfig: NextConfig = {
  // workspace fix
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

  // ✅ only ignore type errors, eslint is removed (Next16 removed this option)
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
