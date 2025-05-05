import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/experiments',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  org: 'agency-fund',
  project: 'xngin-dash',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  automaticVercelMonitors: false,
  telemetry: false,
});
