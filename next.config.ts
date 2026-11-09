import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  // Le logo des courriels est lu sur disque par sendEmail : il doit être inclus dans les fonctions serverless
  outputFileTracingIncludes: {
    '/**': ['./public/email/logo.png'],
  },
};

export default withNextIntl(nextConfig);