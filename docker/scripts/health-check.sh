#!/bin/bash
# ================================================
# ProcureERP ヘルスチェック・監視スクリプト
# 企業級システム監視・アラート機能
# ================================================

set -e

# 色付きログ関数
log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[0;33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }

# ヘルスチェック結果
declare -A health_status
declare -A health_details
overall_status="HEALTHY"

# タイムスタンプ
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

echo "🏥 ProcureERP システムヘルスチェック開始 - $timestamp"
echo "============================================"

# Docker サービス状態チェック
check_docker_services() {
    log_info "🐳 Docker サービス状態チェック中..."
    
    services=("postgres" "redis" "nginx" "backend" "frontend")
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            health_status["$service"]="HEALTHY"
            uptime=$(docker-compose ps "$service" | grep "Up" | awk '{print $5, $6}')
            health_details["$service"]="稼働中 ($uptime)"
            log_success "✅ $service: 正常稼働中"
        else
            health_status["$service"]="UNHEALTHY"
            health_details["$service"]="停止中またはエラー"
            overall_status="UNHEALTHY"
            log_error "❌ $service: 異常状態"
        fi
    done
}

# データベース接続チェック
check_database_connection() {
    log_info "🗄️ データベース接続チェック中..."
    
    if docker-compose exec -T postgres pg_isready -U procure_erp_user -d procure_erp_db &>/dev/null; then
        health_status["database_connection"]="HEALTHY"
        
        # 接続数チェック
        connections=$(docker-compose exec -T postgres psql -U procure_erp_user -d procure_erp_db -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='procure_erp_db';" | tr -d ' ')
        health_details["database_connection"]="接続数: $connections"
        log_success "✅ データベース接続: 正常 (接続数: $connections)"
    else
        health_status["database_connection"]="UNHEALTHY"
        health_details["database_connection"]="接続失敗"
        overall_status="UNHEALTHY"
        log_error "❌ データベース接続: 失敗"
    fi
}

# Redis接続チェック
check_redis_connection() {
    log_info "🔴 Redis接続チェック中..."
    
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        health_status["redis_connection"]="HEALTHY"
        
        # メモリ使用量チェック
        memory_usage=$(docker-compose exec -T redis redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        health_details["redis_connection"]="メモリ使用量: $memory_usage"
        log_success "✅ Redis接続: 正常 (メモリ使用量: $memory_usage)"
    else
        health_status["redis_connection"]="UNHEALTHY"
        health_details["redis_connection"]="接続失敗"
        overall_status="UNHEALTHY"
        log_error "❌ Redis接続: 失敗"
    fi
}

# API エンドポイント チェック
check_api_endpoints() {
    log_info "🔌 API エンドポイント チェック中..."
    
    # バックエンドAPI
    if curl -s -f -m 10 http://localhost:3001/health &>/dev/null; then
        health_status["backend_api"]="HEALTHY"
        response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/health)
        health_details["backend_api"]="応答時間: ${response_time}s"
        log_success "✅ バックエンドAPI: 正常 (応答時間: ${response_time}s)"
    else
        health_status["backend_api"]="UNHEALTHY"
        health_details["backend_api"]="応答なし"
        overall_status="UNHEALTHY"
        log_error "❌ バックエンドAPI: 異常"
    fi
    
    # フロントエンド
    if curl -s -f -m 10 http://localhost:3000 &>/dev/null; then
        health_status["frontend"]="HEALTHY"
        response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000)
        health_details["frontend"]="応答時間: ${response_time}s"
        log_success "✅ フロントエンド: 正常 (応答時間: ${response_time}s)"
    else
        health_status["frontend"]="UNHEALTHY"
        health_details["frontend"]="応答なし"
        overall_status="UNHEALTHY"
        log_error "❌ フロントエンド: 異常"
    fi
}

# システムリソース チェック
check_system_resources() {
    log_info "💻 システムリソース チェック中..."
    
    # CPU使用率
    cpu_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep -E "(backend|frontend|postgres|redis|nginx)" | awk '{sum+=$2} END {printf "%.2f", sum}')
    
    # メモリ使用量
    memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep -E "(backend|frontend|postgres|redis|nginx)" | awk -F'/' '{gsub(/[^0-9.]/, "", $1); sum+=$1} END {printf "%.2f", sum}')
    
    health_status["system_resources"]="HEALTHY"
    health_details["system_resources"]="CPU: ${cpu_usage}%, メモリ: ${memory_usage}MB"
    
    log_success "✅ システムリソース: CPU ${cpu_usage}%, メモリ ${memory_usage}MB"
}

# ディスク容量チェック
check_disk_space() {
    log_info "💾 ディスク容量チェック中..."
    
    # データベースボリューム
    db_usage=$(docker system df -v | grep postgres | awk '{print $3}' | head -1)
    
    # アプリケーションボリューム
    app_usage=$(docker system df -v | grep procure | awk '{print $3}' | head -1)
    
    health_status["disk_space"]="HEALTHY"
    health_details["disk_space"]="DB: ${db_usage:-0B}, アプリ: ${app_usage:-0B}"
    
    log_success "✅ ディスク容量: DB ${db_usage:-0B}, アプリ ${app_usage:-0B}"
}

# ログ監視
check_error_logs() {
    log_info "📋 エラーログ監視中..."
    
    # 過去1時間のエラーログ数
    error_count=$(docker-compose logs --since="1h" 2>&1 | grep -i "error\|exception\|failed" | wc -l)
    
    if [ "$error_count" -gt 10 ]; then
        health_status["error_logs"]="WARNING"
        health_details["error_logs"]="過去1時間のエラー: ${error_count}件"
        log_warn "⚠️ エラーログ: 過去1時間で${error_count}件のエラー"
    else
        health_status["error_logs"]="HEALTHY"
        health_details["error_logs"]="過去1時間のエラー: ${error_count}件"
        log_success "✅ エラーログ: 正常 (${error_count}件)"
    fi
}

# ヘルスチェック結果出力
output_health_report() {
    echo ""
    echo "📊 ヘルスチェック結果サマリー"
    echo "============================================"
    echo "🕐 チェック時刻: $timestamp"
    echo "🏥 総合ステータス: $overall_status"
    echo ""
    echo "📋 詳細結果:"
    
    for service in "${!health_status[@]}"; do
        status="${health_status[$service]}"
        details="${health_details[$service]}"
        
        case $status in
            "HEALTHY")
                echo "  ✅ $service: $status - $details"
                ;;
            "WARNING")
                echo "  ⚠️ $service: $status - $details"
                ;;
            "UNHEALTHY")
                echo "  ❌ $service: $status - $details"
                ;;
        esac
    done
    
    echo ""
    echo "============================================"
}

# JSON形式でレポート出力
output_json_report() {
    if [ "$1" = "--json" ]; then
        echo "{"
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"overall_status\": \"$overall_status\","
        echo "  \"services\": {"
        
        first=true
        for service in "${!health_status[@]}"; do
            if [ "$first" = true ]; then
                first=false
            else
                echo ","
            fi
            echo -n "    \"$service\": {\"status\": \"${health_status[$service]}\", \"details\": \"${health_details[$service]}\"}"
        done
        
        echo ""
        echo "  }"
        echo "}"
    fi
}

# メイン実行
main() {
    check_docker_services
    check_database_connection
    check_redis_connection
    check_api_endpoints
    check_system_resources
    check_disk_space
    check_error_logs
    
    output_health_report
    output_json_report "$1"
    
    # 異常時の終了ステータス
    if [ "$overall_status" != "HEALTHY" ]; then
        exit 1
    fi
}

# スクリプト実行
main "$@"
