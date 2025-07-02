# ================================================
# ProcureERP Backend Dockerfile
# Node.js 20 LTS + 多段階ビルド最適化
# ================================================

FROM node:20-alpine AS base

# 作業ディレクトリ作成
WORKDIR /app

# 必要なパッケージインストール
RUN apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    openssl \
    ca-certificates

# セキュリティ設定
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# ================================================
# Dependencies Stage
# ================================================
FROM base AS deps

# パッケージファイルコピー
COPY package*.json ./
COPY prisma ./prisma/

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

# Prismaクライアント生成
RUN npx prisma generate

# アプリケーションビルド
RUN npm run build

# ================================================
# Production Stage
# ================================================
FROM base AS production

# 環境変数設定
ENV NODE_ENV=production
ENV PORT=3001

# 本番依存関係コピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# ビルド成果物コピー
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# 起動スクリプトコピー
COPY --from=build /app/docker/scripts/startup.sh ./startup.sh

# ログディレクトリ作成
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nestjs:nodejs /app && \
    chmod +x /app/startup.sh

# 非rootユーザーに切り替え
USER nestjs

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z localhost 3001 || exit 1

# ポート公開
EXPOSE 3001

# エントリーポイント
ENTRYPOINT ["dumb-init", "--"]
CMD ["./startup.sh"]
