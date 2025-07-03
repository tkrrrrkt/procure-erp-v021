# ================================================
# ProcureERP Nginx Dockerfile - Production
# 企業級リバースプロキシ・SSL終端・セキュリティ強化
# ================================================

FROM nginx:1.25-alpine AS production

# メタデータラベル
LABEL maintainer="ProcureERP Team"
LABEL version="1.0.0"
LABEL description="ProcureERP Nginx - Enterprise Reverse Proxy & SSL Termination"

# セキュリティ: パッケージ更新・必要なツールインストール
RUN apk update && \
    apk add --no-cache \
    curl \
    ca-certificates \
    openssl \
    certbot \
    certbot-nginx && \
    rm -rf /var/cache/apk/*

# Nginx設定ファイルコピー
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/ /etc/nginx/conf.d/

# SSL証明書ディレクトリ作成
RUN mkdir -p /etc/nginx/ssl /var/log/nginx /var/cache/nginx

# セキュリティ強化: DH Parameters生成
RUN openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

# ログローテーション設定
COPY docker/nginx/logrotate.conf /etc/logrotate.d/nginx

# 権限設定（セキュリティ強化）
RUN chown -R nginx:nginx /var/log/nginx /var/cache/nginx /etc/nginx/ssl && \
    chmod -R 755 /var/log/nginx /var/cache/nginx && \
    chmod -R 600 /etc/nginx/ssl

# ヘルスチェック用スクリプト
COPY docker/nginx/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# ポート公開
EXPOSE 80 443

# ヘルスチェック設定
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Nginxテスト・起動
CMD ["sh", "-c", "nginx -t && nginx -g 'daemon off;'"]

# ================================================
# セキュリティ・パフォーマンス最適化
# ================================================
# - Alpine Linux: 軽量・セキュリティ強化
# - SSL/TLS設定: Modern暗号化プロトコル
# - DH Parameters: Perfect Forward Secrecy
# - セキュリティヘッダー: HSTS、CSP等
# - ログローテーション: 運用最適化
# - ヘルスチェック: 監視・自動復旧対応
# ================================================
