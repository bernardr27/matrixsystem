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
                headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }]
            },
            {
                source: '/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' }
                ]
            }
        ];
    },
    allowedDevOrigins: ['http://192.168.12.114:3005', '*.trycloudflare.com', '*.ts.net', 'localhost:3005', '127.0.0.1:3005'],
    images: {
        unoptimized: true,
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
        optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    },
    webpack: (config) => {
        // Ensure Webpack resolves modules from the monorepo root node_modules
        config.resolve.modules = [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../../node_modules'),
            'node_modules',
        ];
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
