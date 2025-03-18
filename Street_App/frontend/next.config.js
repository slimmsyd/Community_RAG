/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'teal-artistic-bonobo-612.mypinata.cloud',
      'gateway.pinata.cloud',
      'api.dicebear.com',
      'arweave.net'
    ],
  },
  experimental: {
    serverActions: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
  },
  async headers() {
    return [
      {
        source: '/api/auth/discord/callback',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
      };
    }
    
    // Add specific alias resolution for utils
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/utils': require('path').resolve(__dirname, './utils'),
    };
    
    return config;
  },
}

module.exports = nextConfig