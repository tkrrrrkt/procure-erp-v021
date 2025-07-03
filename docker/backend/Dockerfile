# ================================================
# ProcureERP Backend Dockerfile - Production
# 企業級多段階ビルド・セキュリティ強化・最適化
# ================================================

# ================================================
# Stage 1: Base Image - Node.js Alpine
# ================================================
FROM node:20-alpine AS base

# セキュリティ: 非rootユーザー作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S procure-erp -u 1001

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
COPY backend/package*.json ./

# 本番用依存関係のみインストール（セキュリティ・パフォーマンス最適化）
RUN npm ci --only=production --prefer-offline --no-audit --no-fund && \
    npm cache clean --force

# ================================================
# Stage 3: Build Stage
# ================================================
FROM base AS build

# パッケージファイルのコピー
COPY backend/package*.json ./

# 全依存関係インストール（ビルド用）
RUN npm ci --prefer-offline --no-audit --no-fund

# ソースコードコピー
COPY backend/src ./src
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/prisma ./prisma

# TypeScriptビルド
RUN npm run build

# Prismaクライアント生成
RUN npx prisma generate

# 不要なdevDependencies削除（セキュリティ・容量最適化）
RUN npm prune --production

# ================================================
# Stage 4: Production Runtime
# ================================================
FROM base AS production

# メタデータラベル
LABEL maintainer="ProcureERP Team"
LABEL version="1.0.0"
LABEL description="ProcureERP Backend - Enterprise SaaS Application"

# 環境変数設定
ENV NODE_ENV=production
ENV PORT=4000
ENV TZ=Asia/Tokyo

# ヘルスチェック用ツール
RUN apk add --no-cache curl

# 本番用依存関係コピー
COPY --from=deps /app/node_modules ./node_modules

# ビルド済みアプリケーションコピー
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# パッケージ設定ファイル
COPY backend/package*.json ./

# 権限設定（セキュリティ強化）
RUN chown -R procure-erp:nodejs /app && \
    chmod -R 755 /app

# 非rootユーザーへ切り替え
USER procure-erp

# ポート公開
EXPOSE 4000

# ヘルスチェック設定
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

# アプリケーション起動
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# ================================================
# セキュリティ・パフォーマンス最適化
# ================================================
# - 多段階ビルド: 最終イメージサイズ最小化
# - 非rootユーザー: セキュリティ強化
# - dumb-init: プロセス管理最適化
# - ヘルスチェック: コンテナ監視対応
# - Alpine Linux: 軽量・セキュリティ強化
# - 最小限依存関係: 攻撃面最小化
# ================================================
