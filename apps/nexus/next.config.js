const path = require('path');
const cdnAssetPrefix = process.env.CDN_ASSET_PREFIX || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
    assetPrefix: cdnAssetPrefix || undefined,
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    async headers() {
        return [
            {
                source: '/_next/static/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
            }
        ];
    },
    allowedDevOrigins: ['http://192.168.12.114:3001', '*.trycloudflare.com'],
    images: {
        unoptimized: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/auth/:path*',
                destination: 'http://localhost:3005/api/auth/:path*',
            },
        ];
    },
    logging: {
        fetches: { fullUrl: false }
    },
    transpilePackages: [
        '@supabase/supabase-js',
        '@supabase/ssr',
        '@supabase/auth-js',
        '@supabase/functions-js',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@matrix-lib/observability',
        '@matrix-lib/cache'
    ],
    experimental: {
        // Removed @supabase/supabase-js from optimization to prevent instantiation errors
        optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    },
    webpack: (config) => {
        // Bypassing whatwg-url/webidl2js-wrapper issue in legacy node-fetch used by supabase
        config.resolve.alias = {
            ...config.resolve.alias,
            'node-fetch': false,
            'whatwg-url': false,
        };
        return config;
    },
};

module.exports = nextConfig;
