import type { NextConfig } from "next";
import path from "path";

const cdnAssetPrefix = process.env.CDN_ASSET_PREFIX || "";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  extendDefaultRuntimeCaching: true,
});

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  assetPrefix: cdnAssetPrefix || undefined,
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
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      }
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:3005/api/auth/:path*',
      },
    ];
  },

  turbopack: {},
  serverExternalPackages: [],
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ['http://192.168.12.114:3000', '*.trycloudflare.com'],
  logging: {
    fetches: { fullUrl: false }
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns', '@supabase/supabase-js'],
  },
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules'),
      'node_modules',
    ];

    // Bypassing whatwg-url/webidl2js-wrapper issue in legacy node-fetch used by supabase
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mediapipe/tasks-vision': path.resolve(__dirname, '../../node_modules/@mediapipe/tasks-vision'),
      'immer': path.resolve(__dirname, '../../node_modules/immer'),
      'asn1.js': path.resolve(__dirname, '../../node_modules/asn1.js'),
      'webrtc-adapter': path.resolve(__dirname, '../../node_modules/webrtc-adapter'),
      '@msgpack/msgpack': path.resolve(__dirname, '../../node_modules/@msgpack/msgpack'),
      'node-fetch': false,
      'whatwg-url': false,
    };
    return config;
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(withPWA(nextConfig));

