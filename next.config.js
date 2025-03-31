/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: [
      'www.google.com', // For the company logos from Google Favicon API
      'd2q79iu7y748jz.cloudfront.net', // For Indeed company logos
      'media.licdn.com', // For LinkedIn company logos
      'logo.clearbit.com', // For Clearbit company logos
      'cloudfront.net', // General CloudFront URLs
      'company-logo-urls.com' // Placeholder - replace with any other domains you need
    ],
  },
  // Explicitly set the page extension to avoid confusion
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig; 