import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // App is only exported as a static bundle; we aren't using any server-side NextJS features.
  output: 'export',
  distDir: 'dist',
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  org: 'agency-fund',
  project: 'xngin-dash',
  silent: !process.env.CI || process.env.SENTRY_CONFIG_SILENT === 'true',
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  automaticVercelMonitors: false,
  telemetry: false,
});
