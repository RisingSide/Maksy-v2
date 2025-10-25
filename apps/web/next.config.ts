import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // workspace fix
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

  // ✅ only ignore type errors, eslint is removed (Next16 removed this option)
  typescript: { ignoreBuildErrors: true },

  experimental: {
    // keeps App Router stable
    serverActions: { allowedOrigins: ['*'] },
  },
}

export default nextConfig
