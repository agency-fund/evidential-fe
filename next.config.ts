import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/experiments',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withSentryConfig(bundleAnalyzer(nextConfig), {
  org: 'agency-fund',
  project: 'evidential-frontend',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  telemetry: false,
});
