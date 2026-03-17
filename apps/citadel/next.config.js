const path = require('path');
const cdnAssetPrefix = process.env.CDN_ASSET_PREFIX || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
    assetPrefix: cdnAssetPrefix || undefined,
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    images: {
        unoptimized: true
    },
    eslint: {
        // Lint is already enforced in dedicated CI steps.
        ignoreDuringBuilds: true
    },
    typescript: {
        // Type-checking is already enforced in dedicated CI steps.
        ignoreBuildErrors: true
    }
};

module.exports = nextConfig;
