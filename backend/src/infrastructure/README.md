# Infrastructure Layer（インフラストラクチャ層）

## 概要
インフラストラクチャ層は技術的な詳細を実装する層です。データベース、外部サービス、メッセージング、キャッシュなどの技術的な実装を担当します。

## ディレクトリ構成

### database/
データベース関連の実装
- **prisma.service.ts**: Prismaクライアントのラッパー
- **repositories/**: リポジトリパターンの実装
- **migrations/**: データベースマイグレーション

### cache/
キャッシュ層の実装
- **cache.module.ts**: キャッシュモジュール
- **redis.service.ts**: Redis実装

### external-services/
外部サービスとの統合
- **okta/**: Okta認証サービス（認証のみ）
  - JWT検証
  - ユーザー情報取得
- **notification/**: 通知サービス
  - **email/**: メール送信
  - **slack/**: Slack通知
  - **teams/**: Teams通知
- **integration/**: 外部システム連携
  - **erp/**: ERPシステム連携
  - **accounting/**: 会計システム連携

### events/
イベント駆動アーキテクチャの基盤
- **event-bus/**: イベントバス実装
- **event-store/**: イベントストア実装

### messaging/
メッセージング基盤
- **publishers/**: メッセージ発行
- **subscribers/**: メッセージ購読

### filters/
グローバル例外フィルター
- **global-exception.filter.ts**: 例外ハンドリング

### interceptors/
グローバルインターセプター
- **audit-log.interceptor.ts**: 監査ログ
- **tenant.interceptor.ts**: マルチテナント

## 実装例

### リポジトリ実装
```typescript
@Injectable()
export class PurchaseRequestRepositoryImpl implements PurchaseRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(purchaseRequest: PurchaseRequest): Promise<void> {
    const data = this.toPersistence(purchaseRequest);
    await this.prisma.purchaseRequest.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: PurchaseRequestId): Promise<PurchaseRequest | null> {
    const data = await this.prisma.purchaseRequest.findUnique({
      where: { id: id.value },
      include: { items: true },
    });
    
    return data ? this.toDomain(data) : null;
  }

  private toPersistence(domain: PurchaseRequest): any {
    // ドメインオブジェクトをDBスキーマに変換
  }

  private toDomain(data: any): PurchaseRequest {
    // DBデータをドメインオブジェクトに変換
  }
}
```

### Okta統合（最小限）
```typescript
@Injectable()
export class OktaService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(token: string): Promise<OktaUser> {
    // JWTトークンの検証
    // ユーザー情報の取得（ID、メール、テナントIDのみ）
  }

  // 注意: ユーザー管理、MFA、パスワード管理などはOktaで直接管理
  // このサービスでは実装しない
}
```

### イベントバス実装
```typescript
@Injectable()
export class EventBusService {
  private readonly emitter = new EventEmitter2();

  publish(event: DomainEvent): void {
    this.emitter.emit(event.constructor.name, event);
  }

  subscribe<T extends DomainEvent>(
    eventClass: Constructor<T>,
    handler: (event: T) => void,
  ): void {
    this.emitter.on(eventClass.name, handler);
  }
}
```

### キャッシュ実装
```typescript
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
```

## 責務

1. **技術的詳細の実装**
   - データベースアクセス
   - 外部API呼び出し
   - メッセージング

2. **ドメイン層の抽象化の実装**
   - リポジトリインターフェースの実装
   - ドメインサービスインターフェースの実装

3. **インフラストラクチャサービス**
   - キャッシュ管理
   - ファイルストレージ
   - メール送信

4. **クロスカッティング関心事**
   - ロギング
   - 監査
   - パフォーマンス監視

## Okta統合の方針

1. **認証機能のみ**
   - JWT検証
   - 基本的なユーザー情報取得

2. **Oktaで管理する機能（実装しない）**
   - ユーザー登録・管理
   - パスワード管理
   - MFA（多要素認証）
   - SSO（シングルサインオン）
   - セッション管理

3. **内部で管理する機能**
   - ビジネス権限（購買承認権限など）
   - テナント別のアクセス制御
   - 監査ログ

## 設計原則

- ドメイン層への依存（逆転した依存関係）
- 技術的詳細の隠蔽
- インターフェースを通じた疎結合
- 設定の外部化
- テスタビリティの確保
