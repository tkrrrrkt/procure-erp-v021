# 🏢 ProcureERP - 企業級調達管理システム

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Security](https://img.shields.io/badge/security-A+-blue)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![License](https://img.shields.io/badge/license-Enterprise-orange)]()

**ProcureERP** は、現代的な技術スタックで構築された企業級の調達管理システムです。マルチテナント対応、完全セキュリティ統合、企業級監視機能を備え、Docker化による簡単デプロイを実現しています。

## 🌟 主要機能

### 📋 業務機能
- **調達依頼管理**: 部門別申請・承認ワークフロー
- **発注管理**: ベンダー管理・自動発注・進捗追跡
- **入荷管理**: 検品・品質管理・在庫更新
- **在庫管理**: リアルタイム在庫・自動補充・予測分析
- **ベンダー管理**: 評価・契約・支払管理
- **従業員管理**: 組織階層・権限管理・監査証跡

### 🔒 セキュリティ機能
- **Auth0 SSO**: 企業級シングルサインオン
- **CSRF保護**: ワンタイムトークン・自動更新
- **レート制限**: マルチテナント対応・不審行動検知
- **入力検証**: XSS/SQLインジェクション完全防御
- **CSP強化**: 動的コンテンツセキュリティポリシー

### 🏗️ アーキテクチャ
- **マルチテナント**: 完全なデータ分離・組織別設定
- **マイクロサービス**: NestJS + Next.js + Redis + PostgreSQL
- **Docker化**: 本番対応・スケーラブル・簡単デプロイ
- **監視統合**: Prometheus + Grafana + Alertmanager

## 🚀 クイックスタート

### 1. 完全セットアップ（推奨）

```bash
# リポジトリクローン
git clone <repository-url>
cd ProcureERP

# 環境変数設定
cp .env.example .env.docker
# .env.dockerを編集してください

# 完全セットアップ実行
./docker/scripts/full-setup.sh
```

### 2. 開発環境セットアップ

```bash
# 開発環境セットアップ
./docker/scripts/dev-setup.sh

# 手動起動の場合
docker-compose up -d
```

### 3. 本番環境デプロイ

```bash
# 本番環境デプロイ
./docker/scripts/production-deploy.sh

# 監視システム起動
docker-compose -f docker-compose.monitoring.yml up -d
```

## 📊 アクセスURL

| サービス | URL | 説明 |
|---------|-----|------|
| **フロントエンド** | https://localhost | メインアプリケーション |
| **バックエンドAPI** | https://localhost/api | REST API |
| **Grafana** | http://localhost:3001 | 監視ダッシュボード |
| **Prometheus** | http://localhost:9090 | メトリクス収集 |
| **Alertmanager** | http://localhost:9093 | アラート管理 |

## 🛠️ 技術スタック

### バックエンド
- **フレームワーク**: NestJS 10 (TypeScript)
- **データベース**: PostgreSQL 15 + Prisma 5.7
- **キャッシュ**: Redis 7 (クラスター対応)
- **認証**: Auth0 JWT + マルチテナント
- **セキュリティ**: 4層防御システム

### フロントエンド
- **フレームワーク**: Next.js 15 (TypeScript)
- **UI**: Tailwind CSS + Shadcn/ui
- **状態管理**: React Context + SWR
- **認証**: Auth0 React SDK

### インフラ・DevOps
- **コンテナ**: Docker + Docker Compose
- **監視**: Prometheus + Grafana + Alertmanager
- **ログ**: 構造化ログ + ELK Stack対応
- **CI/CD**: GitHub Actions対応

## 📁 プロジェクト構造

```
ProcureERP/
├── backend/                 # NestJSバックエンド
│   ├── src/
│   │   ├── modules/        # 業務モジュール
│   │   ├── security/       # セキュリティ機能
│   │   └── common/         # 共通機能
│   ├── test/               # テストスイート
│   └── Dockerfile          # バックエンドDocker設定
├── frontend/               # Next.jsフロントエンド
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # UIコンポーネント
│   │   └── lib/           # ユーティリティ
│   └── Dockerfile         # フロントエンドDocker設定
├── docker/                # Docker設定
│   ├── nginx/             # Nginx設定
│   ├── postgres/          # PostgreSQL初期化
│   ├── redis/             # Redis設定
│   ├── scripts/           # 運用スクリプト
│   └── monitoring/        # 監視設定
├── docker-compose.yml     # 開発環境
├── docker-compose.prod.yml # 本番環境
└── docker-compose.monitoring.yml # 監視システム
```

## 🔧 管理コマンド

### 基本操作
```bash
# サービス状態確認
docker-compose ps

# ログ確認
docker-compose logs -f [service-name]

# データベース操作
docker-compose exec postgres psql -U procure_erp_user -d procure_erp_db

# Redis操作
docker-compose exec redis redis-cli
```

### ヘルスチェック・監視
```bash
# システムヘルスチェック
./docker/scripts/health-check.sh

# 詳細監視レポート
./docker/scripts/health-check.sh --json

# パフォーマンステスト
./docker/scripts/performance-test.sh
```

### バックアップ・復旧
```bash
# データベースバックアップ
./docker/scripts/backup.sh

# データベース復旧
./docker/scripts/restore.sh backup-file.sql
```

## 🧪 テスト実行

### 単体テスト
```bash
# バックエンド単体テスト
cd backend && npm test

# フロントエンド単体テスト
cd frontend && npm test
```

### 統合テスト
```bash
# セキュリティ統合テスト
cd backend && npm run test:security

# E2Eテスト
npm run test:e2e
```

### パフォーマンステスト
```bash
# 負荷テスト実行
./docker/scripts/load-test.sh

# 監視メトリクス確認
curl http://localhost:9090/api/v1/query?query=up
```

## 🔒 セキュリティ設定

### 本番環境設定

1. **SSL証明書設置**
```bash
# SSL証明書配置
cp your-ssl.crt docker/ssl/ssl.crt
cp your-ssl.key docker/ssl/ssl.key
```

2. **パスワード設定**
```bash
# 強力なパスワード生成・設定
echo "your-strong-password" > docker/secrets/postgres_password.txt
echo "your-redis-password" > docker/secrets/redis_password.txt
chmod 600 docker/secrets/*
```

3. **環境変数設定**
```bash
# .env.dockerで本番設定
NODE_ENV=production
JWT_SECRET=your-strong-jwt-secret
AUTH0_CLIENT_SECRET=your-auth0-secret
```

### セキュリティ監査
```bash
# セキュリティスキャン実行
./docker/scripts/security-scan.sh

# 脆弱性チェック
docker scout cves procure-erp-backend
docker scout cves procure-erp-frontend
```

## 📈 監視・アラート設定

### Grafanaダッシュボード
- **システム監視**: CPU、メモリ、ディスク使用率
- **アプリケーション監視**: レスポンス時間、エラー率
- **セキュリティ監視**: 認証失敗、レート制限発動
- **ビジネス監視**: 取引数、ユーザー活動

### アラート設定
- **クリティカル**: サービス停止、データベース接続失敗
- **警告**: 高負荷、レスポンス遅延、セキュリティイベント
- **通知**: Slack、Email、PagerDuty統合対応

## 🎯 パフォーマンス最適化

### データベース
- **インデックス最適化**: 自動インデックス追加・監視
- **クエリ最適化**: Prismaクエリ最適化・N+1問題回避
- **コネクションプール**: 適切なプール設定・負荷分散

### Redis キャッシュ
- **セッション管理**: 分散セッション・高速アクセス
- **API キャッシュ**: レスポンス時間短縮・負荷軽減
- **レート制限**: 分散レート制限・スケーラブル制御

### フロントエンド
- **Next.js最適化**: SSR/SSG活用・画像最適化
- **バンドル最適化**: Tree shaking・コード分割
- **CDN統合**: 静的アセット高速配信

## 📚 ドキュメント

- [🏗️ アーキテクチャ設計](./docs/architecture.md)
- [🔒 セキュリティガイド](./docs/security.md)
- [📊 API仕様書](./docs/api.md)
- [🛠️ 運用マニュアル](./docs/operations.md)
- [🐛 トラブルシューティング](./docs/troubleshooting.md)

## 🤝 貢献

1. Forkしてください
2. フィーチャーブランチを作成してください (`git checkout -b feature/AmazingFeature`)
3. 変更をコミットしてください (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュしてください (`git push origin feature/AmazingFeature`)
5. プルリクエストを開いてください

## 📜 ライセンス

このプロジェクトは企業ライセンスの下で配布されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

- **バグレポート**: GitHub Issues
- **機能リクエスト**: GitHub Discussions
- **企業サポート**: support@procure-erp.com
- **ドキュメント**: [公式Wiki](https://github.com/your-org/ProcureERP/wiki)

---

## 🎉 セットアップ完了後の確認事項

✅ **サービス起動確認**
- [ ] PostgreSQL (port: 5432)
- [ ] Redis (port: 6379)
- [ ] Backend API (port: 3001)
- [ ] Frontend (port: 3000)
- [ ] Nginx (port: 80/443)

✅ **セキュリティ確認**
- [ ] Auth0認証動作
- [ ] CSRF保護動作
- [ ] レート制限動作
- [ ] SSL証明書有効

✅ **監視システム確認**
- [ ] Prometheus メトリクス収集
- [ ] Grafana ダッシュボード表示
- [ ] Alertmanager アラート設定

✅ **機能テスト**
- [ ] ユーザー登録・ログイン
- [ ] 調達依頼作成・承認
- [ ] 発注・入荷処理
- [ ] 在庫管理機能

---

**🚀 ProcureERP で効率的な調達管理を始めましょう！**
