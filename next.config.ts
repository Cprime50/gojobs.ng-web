import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['www.google.com'], // For the company logos from Google Favicon API
  },
  // Explicitly set the page extension to avoid confusion
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
