/** @type {import('next').NextConfig} */
const path = require('path');
const EmptyModulePlugin = require('./empty-module-plugin');

const nextConfig = {
  images: {
    domains: [
      'teal-artistic-bonobo-612.mypinata.cloud',
      'gateway.pinata.cloud',
      'api.dicebear.com',
      'arweave.net'
    ],
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
    
    // Simplified path aliases configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    // Add our EmptyModulePlugin to handle missing 'lib/utils'
    // But ignore paths that are actually used for authentication and DB connections
    config.plugins.push(
      new EmptyModulePlugin({
        modules: ['lib/utils'],
        exactPaths: [
          './lib/utils', 
          '../lib/utils', 
          '../../lib/utils',
          '../components/lib/utils',
          '@/lib/utils'
        ],
        ignorePaths: [
          'app/api/lib',           // Ignore API lib paths
          'app/api/auth',          // Ignore Auth paths
          '@/lib/dbConnect',       // Ignore DB connection paths
        ],
        verbose: true
      })
    );
    
    return config;
  },
}

module.exports = nextConfig