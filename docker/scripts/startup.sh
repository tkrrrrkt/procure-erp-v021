#!/bin/bash
# ================================================
# ProcureERP Docker起動スクリプト
# 企業級ERP自動起動・初期化処理
# ================================================

set -e

echo "🚀 ProcureERP Docker起動開始..."

# 環境変数確認
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URLが設定されていません"
    exit 1
fi

echo "📊 環境設定確認:"
echo "  - NODE_ENV: ${NODE_ENV:-development}"
echo "  - PORT: ${PORT:-3000}"
echo "  - DATABASE: データベース接続確認中..."

# データベース接続待機
echo "⏳ データベース接続待機中..."
timeout=60
while ! nc -z postgres 5432; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ データベース接続タイムアウト"
        exit 1
    fi
    echo "   待機中... (残り${timeout}秒)"
    sleep 1
done
echo "✅ データベース接続確認完了"

# Redis接続待機
echo "⏳ Redis接続待機中..."
timeout=30
while ! nc -z redis 6379; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ Redis接続タイムアウト"
        exit 1
    fi
    echo "   待機中... (残り${timeout}秒)"
    sleep 1
done
echo "✅ Redis接続確認完了"

# Prismaデータベースマイグレーション
echo "🗃️ データベースマイグレーション実行中..."
if [ "$NODE_ENV" = "production" ]; then
    npx prisma db push --force-reset
else
    npx prisma db push
fi

# Prismaクライアント生成
echo "🔧 Prismaクライアント生成中..."
npx prisma generate

# データベース初期データ投入（開発環境のみ）
if [ "$NODE_ENV" != "production" ]; then
    echo "🌱 開発用初期データ投入中..."
    if [ -f "prisma/seed.ts" ]; then
        npx tsx prisma/seed.ts
    else
        echo "⚠️ prisma/seed.tsが見つかりません（スキップ）"
    fi
fi

# ログディレクトリ作成
mkdir -p /app/logs

# アプリケーション起動
echo "🎯 ProcureERP アプリケーション起動中..."
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 本番モードで起動"
    exec node dist/main.js
else
    echo "🛠️ 開発モードで起動"
    exec npm run start:dev
fi
