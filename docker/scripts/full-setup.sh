#!/bin/bash

# ================================================
# ProcureERP 完全セットアップスクリプト
# 本番環境 + 監視システム統合デプロイ
# ================================================

set -euo pipefail

# ==========================================
# 設定
# ==========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/full-setup-$(date +%Y%m%d_%H%M%S).log"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"
}

# ==========================================
# 前提条件チェック
# ==========================================
check_prerequisites() {
    log "🔍 前提条件チェック中..."
    
    # Docker確認
    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません"
        exit 1
    fi
    
    # Docker Compose確認
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Composeがインストールされていません"
        exit 1
    fi
    
    # 環境ファイル確認
    if [[ ! -f "$PROJECT_ROOT/.env.docker" ]]; then
        log_error ".env.dockerファイルが見つかりません"
        exit 1
    fi
    
    log_success "前提条件チェック完了"
}

# ==========================================
# 環境準備
# ==========================================
prepare_environment() {
    log "🛠️ 環境準備中..."
    
    cd "$PROJECT_ROOT"
    
    # ログディレクトリ作成
    mkdir -p logs uploads docker/ssl docker/secrets
    
    # SSL証明書生成（存在しない場合）
    if [[ ! -f "docker/ssl/ssl.crt" ]] || [[ ! -f "docker/ssl/ssl.key" ]]; then
        log "SSL証明書を生成しています..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout docker/ssl/ssl.key \
            -out docker/ssl/ssl.crt \
            -subj "/C=JP/ST=Tokyo/L=Tokyo/O=ProcureERP/CN=localhost" || {
            log_warning "SSL証明書の生成に失敗しました（本番環境では手動設定が必要）"
        }
    fi
    
    # Docker secretsファイル作成
    if [[ ! -f "docker/secrets/postgres_password.txt" ]]; then
        echo "${POSTGRES_PASSWORD:-procure_erp_password_2024!}" > docker/secrets/postgres_password.txt
        chmod 600 docker/secrets/postgres_password.txt
    fi
    
    if [[ ! -f "docker/secrets/redis_password.txt" ]]; then
        echo "${REDIS_PASSWORD:-redis_password_2024!}" > docker/secrets/redis_password.txt
        chmod 600 docker/secrets/redis_password.txt
    fi
    
    log_success "環境準備完了"
}

# ==========================================
# アプリケーションビルド
# ==========================================
build_applications() {
    log "🏗️ アプリケーションビルド中..."
    
    # バックエンドビルド
    if [[ -d "backend" ]]; then
        cd backend
        log "バックエンドの依存関係をインストール中..."
        npm ci --production=false
        log "Prismaクライアント生成中..."
        npx prisma generate
        log "バックエンドビルド中..."
        npm run build
        cd "$PROJECT_ROOT"
    fi
    
    # フロントエンドビルド
    if [[ -d "frontend" ]]; then
        cd frontend
        log "フロントエンドの依存関係をインストール中..."
        npm ci --production=false
        log "フロントエンドビルド中..."
        npm run build
        cd "$PROJECT_ROOT"
    fi
    
    log_success "アプリケーションビルド完了"
}

# ==========================================
# Dockerイメージビルド
# ==========================================
build_docker_images() {
    log "🐳 Dockerイメージビルド中..."
    
    # 既存コンテナ停止・削除
    docker-compose down --remove-orphans || true
    
    # イメージビルド
    docker-compose build --no-cache --parallel
    
    log_success "Dockerイメージビルド完了"
}

# ==========================================
# サービス起動
# ==========================================
start_services() {
    log "🚀 サービス起動中..."
    
    # メインサービス起動
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    # 監視サービス起動
    if [[ -f "docker-compose.monitoring.yml" ]]; then
        log "監視サービス起動中..."
        docker-compose -f docker-compose.monitoring.yml up -d
    fi
    
    # サービス安定化待機
    log "サービス安定化待機中..."
    sleep 30
    
    log_success "サービス起動完了"
}

# ==========================================
# ヘルスチェック
# ==========================================
run_health_checks() {
    log "🏥 ヘルスチェック実行中..."
    
    # 基本的なヘルスチェック
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "ヘルスチェック試行 $attempt/$max_attempts"
        
        # PostgreSQL確認
        if docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-procure_erp_user}" &>/dev/null; then
            log_success "PostgreSQL: 正常"
        else
            log_warning "PostgreSQL: 異常"
        fi
        
        # Redis確認
        if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
            log_success "Redis: 正常"
        else
            log_warning "Redis: 異常"
        fi
        
        # バックエンド確認
        if curl -f http://localhost:3001/api/health &>/dev/null; then
            log_success "Backend: 正常"
            break
        else
            log_warning "Backend: 異常 (試行 $attempt/$max_attempts)"
        fi
        
        ((attempt++))
        sleep 10
    done
    
    # 詳細ヘルスチェック実行
    if [[ -x "$SCRIPT_DIR/health-check.sh" ]]; then
        log "詳細ヘルスチェック実行中..."
        "$SCRIPT_DIR/health-check.sh" || log_warning "詳細ヘルスチェックで警告が検出されました"
    fi
    
    log_success "ヘルスチェック完了"
}

# ==========================================
# 最終確認・レポート
# ==========================================
final_report() {
    log "📊 最終レポート生成中..."
    
    echo
    echo "========================================"
    echo "🎉 ProcureERP 完全セットアップ完了"
    echo "========================================"
    echo
    
    # サービス状態表示
    echo "📋 サービス状態:"
    docker-compose ps
    echo
    
    # アクセスURL表示
    echo "🌐 アクセスURL:"
    echo "  📱 フロントエンド:      https://localhost"
    echo "  🔧 バックエンドAPI:     https://localhost/api"
    echo "  📊 Grafana:            http://localhost:3001"
    echo "  🔍 Prometheus:         http://localhost:9090"
    echo "  🚨 Alertmanager:       http://localhost:9093"
    echo
    
    # 管理コマンド
    echo "🛠️ 管理コマンド:"
    echo "  停止:           docker-compose down"
    echo "  ログ確認:       docker-compose logs -f [service]"
    echo "  ヘルスチェック: ./docker/scripts/health-check.sh"
    echo "  バックアップ:   ./docker/scripts/backup.sh"
    echo
    
    # セキュリティ注意事項
    echo "🔒 セキュリティ注意事項:"
    echo "  - デフォルトパスワードを変更してください"
    echo "  - SSL証明書を本番用に置き換えてください"
    echo "  - ファイアウォール設定を確認してください"
    echo "  - 定期的なバックアップを設定してください"
    echo
    
    log_success "ProcureERP 完全セットアップが正常に完了しました"
}

# ==========================================
# メイン実行
# ==========================================
main() {
    log "🚀 ProcureERP 完全セットアップ開始"
    
    # ログディレクトリ作成
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # 各フェーズ実行
    check_prerequisites
    prepare_environment
    build_applications
    build_docker_images
    start_services
    run_health_checks
    final_report
    
    log_success "全セットアップ処理が完了しました"
}

# エラーハンドリング
trap 'log_error "セットアップ中にエラーが発生しました (行: $LINENO)"; exit 1' ERR

# メイン実行
main "$@"
