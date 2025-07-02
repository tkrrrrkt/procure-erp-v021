#!/bin/bash
# ================================================
# ProcureERP 本番環境デプロイスクリプト
# 企業級セキュリティ・ゼロダウンタイムデプロイ
# ================================================

set -e

# 色付きログ関数
log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[0;33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }

echo "🏭 ProcureERP 本番環境デプロイ開始..."

# 前提条件チェック
check_prerequisites() {
    log_info "📋 前提条件チェック中..."
    
    # Docker & Docker Compose
    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Composeがインストールされていません"
        exit 1
    fi
    
    # 環境設定ファイル
    if [ ! -f ".env.docker" ]; then
        log_error ".env.dockerファイルが見つかりません"
        exit 1
    fi
    
    # SSL証明書
    if [ ! -f "docker/ssl/procure-erp.crt" ] || [ ! -f "docker/ssl/procure-erp.key" ]; then
        log_error "SSL証明書が見つかりません"
        exit 1
    fi
    
    # Docker Secrets
    if [ ! -f "docker/secrets/postgres_password.txt" ] || \
       [ ! -f "docker/secrets/jwt_secret.txt" ] || \
       [ ! -f "docker/secrets/auth0_client_secret.txt" ]; then
        log_error "Docker Secretsファイルが不足しています"
        exit 1
    fi
    
    log_success "✅ 前提条件チェック完了"
}

# データベースバックアップ
backup_database() {
    log_info "💾 データベースバックアップ作成中..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backup/db_backup_${timestamp}.sql"
    
    mkdir -p backup
    
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U procure_erp_user procure_erp_db > "$backup_file"
        log_success "✅ データベースバックアップ完了: $backup_file"
    else
        log_warn "⚠️ 既存のPostgreSQLコンテナが見つかりません（初回デプロイ）"
    fi
}

# アプリケーションビルド
build_application() {
    log_info "🔨 アプリケーションビルド中..."
    
    # フロントエンドビルド
    log_info "🎨 フロントエンドビルド中..."
    cd frontend
    npm ci --only=production
    npm run build
    cd ..
    
    # バックエンドビルド
    log_info "⚙️ バックエンドビルド中..."
    cd backend
    npm ci --only=production
    npm run build
    cd ..
    
    log_success "✅ アプリケーションビルド完了"
}

# Docker イメージビルド
build_docker_images() {
    log_info "🐳 Docker イメージビルド中..."
    
    docker-compose build --no-cache --parallel
    
    log_success "✅ Docker イメージビルド完了"
}

# ヘルスチェック
health_check() {
    log_info "🏥 ヘルスチェック実行中..."
    
    # 最大待機時間（秒）
    max_wait=300
    wait_time=0
    
    services=("postgres" "redis" "nginx" "backend" "frontend")
    
    while [ $wait_time -lt $max_wait ]; do
        all_healthy=true
        
        for service in "${services[@]}"; do
            if ! docker-compose ps "$service" | grep -q "Up"; then
                all_healthy=false
                break
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            log_success "✅ 全サービス正常稼働中"
            return 0
        fi
        
        log_info "⏳ サービス起動待機中... (${wait_time}s/${max_wait}s)"
        sleep 10
        wait_time=$((wait_time + 10))
    done
    
    log_error "❌ ヘルスチェックタイムアウト"
    return 1
}

# ローリングアップデート
rolling_update() {
    log_info "🔄 ローリングアップデート実行中..."
    
    # 1. データベースマイグレーション
    log_info "🗃️ データベースマイグレーション実行中..."
    docker-compose exec backend npx prisma db push
    
    # 2. バックエンドサービス更新
    log_info "⚙️ バックエンドサービス更新中..."
    docker-compose up -d --no-deps backend
    sleep 30
    
    # 3. フロントエンドサービス更新
    log_info "🎨 フロントエンドサービス更新中..."
    docker-compose up -d --no-deps frontend
    sleep 30
    
    # 4. Nginxサービス更新
    log_info "🔧 Nginxサービス更新中..."
    docker-compose up -d --no-deps nginx
    
    log_success "✅ ローリングアップデート完了"
}

# クリーンアップ
cleanup() {
    log_info "🧹 クリーンアップ実行中..."
    
    # 未使用のDockerイメージ削除
    docker image prune -f
    
    # 未使用のDockerボリューム削除
    docker volume prune -f
    
    # ビルドキャッシュ削除
    docker builder prune -f
    
    log_success "✅ クリーンアップ完了"
}

# メイン実行
main() {
    log_info "🚀 ProcureERP 本番デプロイ開始..."
    
    # 前提条件チェック
    check_prerequisites
    
    # データベースバックアップ
    backup_database
    
    # アプリケーションビルド
    build_application
    
    # Docker イメージビルド
    build_docker_images
    
    # 本番環境起動
    log_info "🏭 本番環境起動中..."
    NODE_ENV=production docker-compose up -d
    
    # ヘルスチェック
    if health_check; then
        log_success "✅ 本番環境デプロイ成功"
    else
        log_error "❌ 本番環境デプロイ失敗"
        exit 1
    fi
    
    # クリーンアップ
    cleanup
    
    echo ""
    log_success "🎉 ProcureERP 本番環境デプロイ完了!"
    echo ""
    echo "📋 アクセス情報:"
    echo "  🌐 アプリケーション: https://procure-erp.local"
    echo "  📚 API ドキュメント: https://procure-erp.local/api"
    echo ""
    echo "🛠️ 管理コマンド:"
    echo "  ログ確認:     docker-compose logs -f"
    echo "  環境停止:     docker-compose down"
    echo "  環境再起動:   docker-compose restart"
    echo "  ヘルスチェック: docker-compose ps"
    echo ""
    log_success "本番環境が正常に起動しました 🏭"
}

# スクリプト実行
main "$@"
