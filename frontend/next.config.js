/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker対応設定
  output: 'standalone',
  
  // パフォーマンス最適化
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // 画像最適化
  images: {
    domains: ['localhost', 'procure-erp.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  // 環境変数
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // ビルド最適化
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
