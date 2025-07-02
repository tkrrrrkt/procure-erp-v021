#!/bin/bash
# ================================================
# ProcureERP 開発環境セットアップスクリプト
# 開発者向け環境構築・初期化自動化
# ================================================

set -e

echo "🛠️ ProcureERP 開発環境セットアップ開始..."

# 色付きログ関数
log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[0;33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

# 必要なディレクトリ作成
log_info "📁 ディレクトリ構造作成中..."
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p logs/nginx
mkdir -p logs/app
mkdir -p uploads

# 権限設定
log_info "🔒 権限設定中..."
chmod 755 data/postgres data/redis logs uploads
chmod 755 docker/scripts/*.sh

# Docker Compose環境確認
log_info "🐳 Docker環境確認中..."
if ! command -v docker &> /dev/null; then
    log_error "Dockerがインストールされていません"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Composeがインストールされていません"
    exit 1
fi

# 環境設定ファイル確認
log_info "📋 環境設定確認中..."
if [ ! -f ".env.docker" ]; then
    log_error ".env.dockerファイルが見つかりません"
    exit 1
fi

# SSL証明書確認（本番環境のみ）
if [ "$NODE_ENV" = "production" ]; then
    log_info "🔐 SSL証明書確認中..."
    if [ ! -f "docker/ssl/procure-erp.crt" ] || [ ! -f "docker/ssl/procure-erp.key" ]; then
        log_warn "SSL証明書が見つかりません。生成中..."
        mkdir -p docker/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout docker/ssl/procure-erp.key \
            -out docker/ssl/procure-erp.crt \
            -subj "/C=JP/ST=Tokyo/L=Tokyo/O=ProcureERP/CN=procure-erp.local"
        log_info "✅ 自己署名SSL証明書を生成しました"
    fi
fi

# Docker Secrets作成（本番環境のみ）
if [ "$NODE_ENV" = "production" ]; then
    log_info "🔑 Docker Secrets作成中..."
    mkdir -p docker/secrets
    
    # PostgreSQLパスワード
    if [ ! -f "docker/secrets/postgres_password.txt" ]; then
        echo "procure_erp_password_2024!" > docker/secrets/postgres_password.txt
        chmod 600 docker/secrets/postgres_password.txt
    fi
    
    # JWTシークレット
    if [ ! -f "docker/secrets/jwt_secret.txt" ]; then
        openssl rand -base64 32 > docker/secrets/jwt_secret.txt
        chmod 600 docker/secrets/jwt_secret.txt
    fi
    
    # Auth0クライアントシークレット（プレースホルダー）
    if [ ! -f "docker/secrets/auth0_client_secret.txt" ]; then
        echo "your-auth0-client-secret-change-this" > docker/secrets/auth0_client_secret.txt
        chmod 600 docker/secrets/auth0_client_secret.txt
        log_warn "Auth0クライアントシークレットを設定してください"
    fi
fi

# 既存コンテナ停止・削除
log_info "🛑 既存コンテナ停止中..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Docker images pull
log_info "📦 Docker Images取得中..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml pull

# 開発環境起動
log_info "🚀 開発環境起動中..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# ヘルスチェック
log_info "🏥 サービスヘルスチェック中..."
sleep 10

# 各サービス状態確認
services=("postgres" "redis" "nginx" "backend" "frontend")
for service in "${services[@]}"; do
    if docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps "$service" | grep -q "Up"; then
        log_info "✅ $service: 正常稼働中"
    else
        log_warn "⚠️ $service: 状態確認が必要"
    fi
done

# 開発ツール起動確認
dev_tools=("mailhog" "pgadmin" "redis-commander" "docs")
for tool in "${dev_tools[@]}"; do
    if docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps "$tool" | grep -q "Up"; then
        log_info "✅ $tool: 利用可能"
    else
        log_warn "⚠️ $tool: 起動していません"
    fi
done

echo ""
log_info "🎉 ProcureERP 開発環境セットアップ完了!"
echo ""
echo "📋 アクセスURL一覧:"
echo "  🌐 フロントエンド:     http://localhost:3000"
echo "  🔧 バックエンドAPI:    http://localhost:3001"
echo "  📊 pgAdmin:           http://localhost:8080"
echo "  📬 MailHog:           http://localhost:8025"
echo "  🔴 Redis Commander:   http://localhost:8081"
echo "  📚 Swagger API Docs:  http://localhost:3001/api"
echo ""
echo "🛠️ 管理コマンド:"
echo "  ログ確認:     docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
echo "  環境停止:     docker-compose -f docker-compose.yml -f docker-compose.dev.yml down"
echo "  環境再起動:   docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart"
echo ""
log_info "開発環境が正常に起動しました。Happy coding! 🚀"
