import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // App is only exported as a static bundle; we aren't using any server-side NextJS features.
  output: 'export',
  distDir: 'dist',
};

export default nextConfig;
