/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['*'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
  // Explicitly set the page extension to avoid confusion
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig;