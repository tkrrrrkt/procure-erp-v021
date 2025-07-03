#!/bin/sh
# ================================================
# Nginx Health Check Script
# ================================================

# Nginx プロセス確認
if ! pgrep nginx > /dev/null; then
    echo "ERROR: Nginx process not running"
    exit 1
fi

# HTTP エンドポイント確認
if ! curl -f -s http://localhost/health > /dev/null; then
    echo "ERROR: Nginx HTTP health check failed"
    exit 1
fi

# HTTPS エンドポイント確認 (SSL証明書がある場合)
if [ -f /etc/nginx/ssl/cert.pem ]; then
    if ! curl -f -s -k https://localhost/health > /dev/null; then
        echo "ERROR: Nginx HTTPS health check failed"
        exit 1
    fi
fi

echo "SUCCESS: Nginx health check passed"
exit 0
