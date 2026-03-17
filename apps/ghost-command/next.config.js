const path = require('path');
const cdnAssetPrefix = process.env.CDN_ASSET_PREFIX || '';

/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
    output: 'standalone',
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
    allowedDevOrigins: ['http://192.168.12.114:5173', '*.trycloudflare.com'],
    turbopack: {},
    logging: {
        fetches: { fullUrl: false }
    },
    images: {
        unoptimized: true
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
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
    webpack: (config) => {
        // Bypassing whatwg-url/webidl2js-wrapper issue in legacy node-fetch used by supabase
        config.resolve.alias = {
            ...config.resolve.alias,
            'node-fetch': false,
            'whatwg-url': false,
        };
        // Suppress Webpack large string serialization cache warnings
        config.ignoreWarnings = [
            { message: /Serializing big strings/ },
        ];
        return config;
    },
};

module.exports = withPWA(nextConfig);
