import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.18.13', '10.0.0.49'],
  outputFileTracingIncludes: {
    '/**': ['./public/email/logo.png'],
  },
};

export default withNextIntl(nextConfig);