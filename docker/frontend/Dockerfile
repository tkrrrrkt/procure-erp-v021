# ================================================
# ProcureERP Frontend Dockerfile - Production
# Next.js 15企業級最適化・多段階ビルド・セキュリティ強化
# ================================================

# ================================================
# Stage 1: Base Image - Node.js Alpine
# ================================================
FROM node:20-alpine AS base

# Next.js環境変数
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# セキュリティ: 非rootユーザー作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 作業ディレクトリ設定
WORKDIR /app

# セキュリティ: パッケージ更新・必要なツールインストール
RUN apk update && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# ================================================
# Stage 2: Dependencies Installation
# ================================================
FROM base AS deps

# パッケージファイルのコピー
COPY frontend/package*.json ./

# 全依存関係インストール
RUN npm ci --prefer-offline --no-audit --no-fund

# ================================================
# Stage 3: Build Stage
# ================================================
FROM base AS builder

# パッケージファイルのコピー
COPY frontend/package*.json ./

# 全依存関係インストール
RUN npm ci --prefer-offline --no-audit --no-fund

# ソースコードコピー
COPY frontend ./

# Next.js環境変数設定（ビルド時）
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH0_DOMAIN
ARG NEXT_PUBLIC_AUTH0_CLIENT_ID
ARG NEXT_PUBLIC_AUTH0_AUDIENCE

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH0_DOMAIN=$NEXT_PUBLIC_AUTH0_DOMAIN
ENV NEXT_PUBLIC_AUTH0_CLIENT_ID=$NEXT_PUBLIC_AUTH0_CLIENT_ID
ENV NEXT_PUBLIC_AUTH0_AUDIENCE=$NEXT_PUBLIC_AUTH0_AUDIENCE

# Next.jsビルド（最適化・静的エクスポート）
RUN npm run build

# ================================================
# Stage 4: Production Runtime
# ================================================
FROM base AS production

# メタデータラベル
LABEL maintainer="ProcureERP Team"
LABEL version="1.0.0"
LABEL description="ProcureERP Frontend - Enterprise SaaS Next.js Application"

# 環境変数設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV TZ=Asia/Tokyo

# 本番用依存関係のみインストール
COPY frontend/package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit --no-fund && \
    npm cache clean --force

# Next.js設定ファイル
COPY frontend/next.config.js ./

# ビルド済みアプリケーションコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 権限設定（セキュリティ強化）
RUN chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# 非rootユーザーへ切り替え
USER nextjs

# ポート公開
EXPOSE 3000

# ヘルスチェック設定
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# アプリケーション起動
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# ================================================
# Next.js最適化設定
# ================================================
# - Standalone出力: 最小限依存関係
# - 静的ファイル最適化: パフォーマンス向上
# - Image最適化: Next.js Image Optimization
# - Bundle分析対応: webpack-bundle-analyzer
# - Progressive Web App対応
# ================================================
