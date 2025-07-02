#!/bin/bash

# ================================================
# ProcureERP Docker セットアップスクリプト
# 企業級自動化環境構築システム
# ================================================

set -euo pipefail

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 設定変数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
DOCKER_DIR="$PROJECT_ROOT/docker"
SSL_DIR="$DOCKER_DIR/ssl"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_DOCKER_FILE="$PROJECT_ROOT/.env.docker"

# コマンドラインオプション
DEV_MODE=false
FORCE_REBUILD=false
SKIP_SSL=false
QUIET=false

# ヘルプ表示
show_help() {
    cat << EOF
ProcureERP Docker セットアップスクリプト

使用法:
    $0 [オプション]

オプション:
    --dev, -d           開発環境モードで起動
    --force, -f         強制再ビルド（キャッシュクリア）
    --skip-ssl, -s      SSL証明書生成をスキップ
    --quiet, -q         静寂モード（詳細ログ非表示）
    --help, -h          このヘルプを表示

例:
    $0                  # 本番環境で起動
    $0 --dev            # 開発環境で起動
    $0 --force --dev    # 開発環境で強制再ビルド
    $0 --skip-ssl       # SSL証明書生成をスキップして起動

EOF
}

# コマンドラインオプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev|-d)
            DEV_MODE=true
            shift
            ;;
        --force|-f)
            FORCE_REBUILD=true
            shift
            ;;
        --skip-ssl|-s)
            SKIP_SSL=true
            shift
            ;;
        --quiet|-q)
            QUIET=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

# 依存関係チェック
check_dependencies() {
    log_info "依存関係をチェック中..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "以下の依存関係が不足しています: ${missing_deps[*]}"
        log_error "必要なソフトウェアをインストールしてから再実行してください。"
        exit 1
    fi
    
    log_success "依存関係チェック完了"
}

# Docker状態確認
check_docker_status() {
    log_info "Docker状態を確認中..."
    
    if ! docker info &> /dev/null; then
        log_error "Dockerが起動していません。Dockerを起動してから再実行してください。"
        exit 1
    fi
    
    log_success "Docker起動確認完了"
}

# 環境変数検証
validate_environment() {
    log_info "環境変数を検証中..."
    
    # .env.dockerファイルの存在確認
    if [ ! -f "$ENV_DOCKER_FILE" ]; then
        log_warning ".env.dockerファイルが見つかりません。テンプレートから作成します。"
        create_env_docker_template
    fi
    
    # 必須環境変数チェック
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "AUTH0_DOMAIN"
        "AUTH0_CLIENT_ID"
        "AUTH0_CLIENT_SECRET"
    )
    
    source "$ENV_DOCKER_FILE"
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "以下の環境変数が設定されていません: ${missing_vars[*]}"
        log_error "$ENV_DOCKER_FILE ファイルを確認してください。"
        exit 1
    fi
    
    log_success "環境変数検証完了"
}

# .env.dockerテンプレート作成
create_env_docker_template() {
    cat > "$ENV_DOCKER_FILE" << 'EOF'
# ================================================
# ProcureERP Docker環境設定
# ================================================

# データベース設定
DATABASE_URL="postgresql://procure_erp_user:procure_erp_password_2024!@postgres:5432/procure_erp_db"
POSTGRES_DB=procure_erp_db
POSTGRES_USER=procure_erp_user
POSTGRES_PASSWORD=procure_erp_password_2024!

# Redis設定
REDIS_URL="redis://redis:6379"
REDIS_PASSWORD=""

# JWT設定
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Auth0設定（本番環境では必ず変更してください）
AUTH0_DOMAIN="your-auth0-domain.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"
AUTH0_AUDIENCE="https://your-auth0-domain.auth0.com/api/v2/"

# CSRF設定
CSRF_SECRET="your-csrf-secret-key-change-this-in-production"

# セキュリティ設定
THROTTLE_LIMIT=100
THROTTLE_TTL=60
CSP_ENABLED=true
CSP_REPORT_ONLY=false

# アプリケーション設定
NODE_ENV=production
PORT=3000
BACKEND_PORT=3001

# SSL設定
SSL_ENABLED=true
SSL_CERT_PATH="/app/ssl/cert.pem"
SSL_KEY_PATH="/app/ssl/key.pem"

# ログ設定
LOG_LEVEL=info
LOG_FORMAT=json

# メール設定（開発環境）
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USER=""
MAIL_PASS=""
MAIL_FROM="noreply@procure-erp.local"

# 管理者設定
ADMIN_EMAIL="admin@procure-erp.local"
ADMIN_PASSWORD="ChangeThisPassword123!"

# バックアップ設定
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30

EOF
    log_success ".env.dockerテンプレートを作成しました"
}

# SSL証明書生成
generate_ssl_certificates() {
    if [ "$SKIP_SSL" = true ]; then
        log_info "SSL証明書生成をスキップします"
        return
    fi
    
    log_info "SSL証明書を生成中..."
    
    mkdir -p "$SSL_DIR"
    
    # 自己署名証明書の生成
    if [ ! -f "$SSL_DIR/key.pem" ] || [ ! -f "$SSL_DIR/cert.pem" ]; then
        openssl req -x509 -newkey rsa:4096 -keyout "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" \
            -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=ProcureERP/CN=localhost"
        
        # 権限設定
        chmod 600 "$SSL_DIR/key.pem"
        chmod 644 "$SSL_DIR/cert.pem"
        
        log_success "SSL証明書を生成しました"
    else
        log_info "既存のSSL証明書を使用します"
    fi
}

# Dockerネットワーク作成
create_docker_network() {
    log_info "Dockerネットワークを作成中..."
    
    local network_name="procure-erp-network"
    
    if ! docker network ls | grep -q "$network_name"; then
        docker network create "$network_name" --driver bridge
        log_success "Dockerネットワーク '$network_name' を作成しました"
    else
        log_info "Dockerネットワーク '$network_name' は既に存在します"
    fi
}

# Dockerボリューム作成
create_docker_volumes() {
    log_info "Dockerボリュームを作成中..."
    
    local volumes=(
        "procure-erp-postgres-data"
        "procure-erp-redis-data"
        "procure-erp-uploads"
        "procure-erp-logs"
        "procure-erp-backups"
    )
    
    for volume in "${volumes[@]}"; do
        if ! docker volume ls | grep -q "$volume"; then
            docker volume create "$volume"
            log_success "Dockerボリューム '$volume' を作成しました"
        else
            log_info "Dockerボリューム '$volume' は既に存在します"
        fi
    done
}

# Docker Composeファイル選択
get_compose_files() {
    if [ "$DEV_MODE" = true ]; then
        echo "-f docker-compose.yml -f docker-compose.dev.yml"
    else
        echo "-f docker-compose.yml"
    fi
}

# Docker Composeサービス起動
start_services() {
    log_info "Dockerサービスを起動中..."
    
    local compose_files=$(get_compose_files)
    
    if [ "$FORCE_REBUILD" = true ]; then
        log_info "強制再ビルドを実行中..."
        eval "docker-compose $compose_files down --volumes --remove-orphans"
        eval "docker-compose $compose_files build --no-cache"
    fi
    
    eval "docker-compose $compose_files up -d"
    
    log_success "Dockerサービスを起動しました"
}

# ヘルスチェック
health_check() {
    log_info "ヘルスチェックを実行中..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if [ "$QUIET" != true ]; then
            echo -n "."
        fi
        
        # PostgreSQL接続確認
        if docker-compose exec -T postgres pg_isready -U procure_erp_user -d procure_erp_db &> /dev/null; then
            log_success "PostgreSQL接続確認完了"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "PostgreSQL接続確認に失敗しました"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
    
    # Redis接続確認
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis接続確認完了"
    else
        log_warning "Redis接続確認に失敗しました"
    fi
    
    # アプリケーション起動確認
    sleep 5
    if curl -f -s http://localhost:3001/health &> /dev/null; then
        log_success "バックエンドアプリケーション起動確認完了"
    else
        log_warning "バックエンドアプリケーションの起動確認に失敗しました"
    fi
    
    if curl -f -s http://localhost:3000 &> /dev/null; then
        log_success "フロントエンドアプリケーション起動確認完了"
    else
        log_warning "フロントエンドアプリケーションの起動確認に失敗しました"
    fi
}

# 初期データ投入
seed_initial_data() {
    log_info "初期データを投入中..."
    
    # データベース初期化の完了を待つ
    sleep 10
    
    # 初期データ投入スクリプトがあれば実行
    if [ -f "$DOCKER_DIR/scripts/seed-data.sql" ]; then
        docker-compose exec -T postgres psql -U procure_erp_user -d procure_erp_db < "$DOCKER_DIR/scripts/seed-data.sql"
        log_success "初期データ投入完了"
    else
        log_info "初期データ投入スクリプトが見つかりません"
    fi
}

# バックアップ機能セットアップ
setup_backup() {
    log_info "バックアップ機能をセットアップ中..."
    
    local backup_script="$DOCKER_DIR/scripts/backup.sh"
    
    # バックアップスクリプト作成
    mkdir -p "$DOCKER_DIR/scripts"
    
    cat > "$backup_script" << 'EOF'
#!/bin/bash

# データベースバックアップ
BACKUP_DIR="/var/backups/procure-erp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

# PostgreSQLバックアップ
docker-compose exec -T postgres pg_dump -U procure_erp_user procure_erp_db > "$BACKUP_FILE"

# 古いバックアップファイルの削除（30日以上）
find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +30 -delete

echo "バックアップ完了: $BACKUP_FILE"
EOF
    
    chmod +x "$backup_script"
    
    log_success "バックアップ機能セットアップ完了"
}

# 起動完了メッセージ
show_completion_message() {
    echo ""
    echo "================================================"
    log_success "ProcureERP Docker環境の起動が完了しました！"
    echo "================================================"
    echo ""
    
    if [ "$DEV_MODE" = true ]; then
        echo "🚀 開発環境URLs:"
        echo "   Frontend:      http://localhost:3000"
        echo "   Backend API:   http://localhost:3001"
        echo "   Adminer:       http://localhost:8080"
        echo "   Redis Commander: http://localhost:8081"
        echo "   MailHog:       http://localhost:8025"
    else
        echo "🚀 本番環境URLs:"
        echo "   Application:   https://localhost (SSL)"
        echo "   API:          https://localhost/api"
    fi
    
    echo ""
    echo "📋 管理コマンド:"
    echo "   ログ確認:      docker-compose logs -f"
    echo "   状態確認:      docker-compose ps"
    echo "   停止:          docker-compose down"
    echo "   完全削除:      docker-compose down --volumes --remove-orphans"
    echo ""
    echo "📖 詳細な運用ガイド: README-Docker.md"
    echo ""
}

# エラーハンドリング
error_handler() {
    local line_number=$1
    log_error "スクリプト実行中にエラーが発生しました (行: $line_number)"
    log_error "詳細なログについては docker-compose logs を確認してください"
    exit 1
}

trap 'error_handler $LINENO' ERR

# メイン実行
main() {
    log_info "ProcureERP Docker セットアップを開始します..."
    
    check_dependencies
    check_docker_status
    validate_environment
    generate_ssl_certificates
    create_docker_network
    create_docker_volumes
    start_services
    health_check
    seed_initial_data
    setup_backup
    show_completion_message
    
    log_success "セットアップが正常に完了しました！"
}

# スクリプト実行
main "$@"
