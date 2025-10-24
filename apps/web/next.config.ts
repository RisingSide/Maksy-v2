// @ts-check
import path from 'path'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  // Trace from monorepo root to avoid lockfile warning
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
}
export default nextConfig
