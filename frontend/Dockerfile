# ================================================
# ProcureERP Frontend Dockerfile
# Next.js 15 + 多段階ビルド最適化
# ================================================

FROM node:20-alpine AS base

# 作業ディレクトリ作成
WORKDIR /app

# 必要なパッケージインストール
RUN apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    libc6-compat

# セキュリティ設定
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# ================================================
# Dependencies Stage
# ================================================
FROM base AS deps

# パッケージファイルコピー
COPY package*.json ./

# 依存関係インストール
RUN npm ci --only=production && \
    npm cache clean --force

# ================================================
# Build Stage
# ================================================
FROM base AS build

# 開発依存関係含む全依存関係インストール
COPY package*.json ./
RUN npm ci

# ソースコードコピー
COPY . .

# ビルド時環境変数
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js アプリケーションビルド
RUN npm run build

# ================================================
# Production Stage
# ================================================
FROM base AS production

# 環境変数設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 本番依存関係コピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Next.js ビルド成果物コピー
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# ログディレクトリ作成
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app

# 非rootユーザーに切り替え
USER nextjs

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z localhost 3000 || exit 1

# ポート公開
EXPOSE 3000

# エントリーポイント
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
