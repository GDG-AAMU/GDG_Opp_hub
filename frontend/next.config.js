const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fhcrlxksmamlgsaspsed.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ensure modules are resolved from frontend node_modules
    if (isServer) {
      const originalResolveModules = config.resolve.modules || []
      config.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        ...originalResolveModules.filter(m => !m.includes('node_modules')),
      ]
      
      // Exclude server-side dependencies from webpack bundling
      // They should be loaded at runtime from node_modules
      const serverOnlyModules = [
        'playwright',
        'puppeteer', 
        'playwright-core',
        'cheerio',
        'htmlparser2',
        'entities',
      ]
      
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push(...serverOnlyModules)
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (serverOnlyModules.includes(request)) {
              return callback(null, `commonjs ${request}`)
            }
            callback()
          },
        ]
      } else {
        config.externals = [
          config.externals,
          ...serverOnlyModules,
        ]
      }
    }
    
    return config
  },
}

module.exports = nextConfig

