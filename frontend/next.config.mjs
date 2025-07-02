/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Dev Tools無効化
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // CSP対応: HMRでunsafe-eval回避
  experimental: {
    esmExternals: 'loose',
  },
  
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 開発環境でeval()使用を最小化
      config.devtool = 'eval-source-map'
      
      // HMRの最適化
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named'
      }
    }
    
    return config
  },
  
  // セキュリティヘッダー（middleware.tsと連携）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

export default nextConfig
