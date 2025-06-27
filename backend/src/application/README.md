# Application Layer（アプリケーション層）

## 概要
アプリケーション層はユースケースを実装する層です。ドメイン層のオブジェクトを組み合わせて、アプリケーションのユースケースを実現します。

## ディレクトリ構成

### commands/
- コマンドハンドラー（状態変更を伴う操作）
- CQRSのCommand側
- 各コマンドは単一の責務

### queries/
- クエリハンドラー（読み取り専用操作）
- CQRSのQuery側
- パフォーマンスを考慮した実装

### sagas/
- 長時間実行されるビジネスプロセス
- 複数の集約にまたがるトランザクション
- 補償トランザクションの実装

### decorators/
- カスタムデコレーター
- 横断的関心事の実装
- メタプログラミング

### validators/
- 入力検証ロジック
- ビジネスルールの事前チェック
- DTOレベルのバリデーション

### interfaces/
- アプリケーション層のインターフェース
- 外部サービスの抽象化
- ポートの定義

## 実装パターン

### CQRSパターン
```typescript
// Command例
export class CreatePurchaseRequestCommand {
  constructor(
    public readonly requesterId: string,
    public readonly items: RequestItem[],
    public readonly justification: string,
  ) {}
}

// Query例
export class GetPurchaseRequestsQuery {
  constructor(
    public readonly filter?: PurchaseRequestFilter,
    public readonly pagination?: PaginationParams,
  ) {}
}
```

### ハンドラーの実装
```typescript
@CommandHandler(CreatePurchaseRequestCommand)
export class CreatePurchaseRequestHandler {
  constructor(
    private readonly repository: PurchaseRequestRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreatePurchaseRequestCommand): Promise<string> {
    // ビジネスロジックの実行
    // ドメインオブジェクトの操作
    // イベントの発行
  }
}
```

## 責務

1. **ユースケースの実装**
   - アプリケーションのユースケースを表現
   - ドメインオブジェクトの調整

2. **トランザクション管理**
   - トランザクション境界の定義
   - 整合性の保証

3. **アプリケーションサービス**
   - 外部サービスとの連携
   - 通知、メール送信などの調整

4. **入力検証**
   - DTOレベルの検証
   - ビジネスルールの事前チェック

## 禁止事項

- ビジネスロジックの実装（ドメイン層で実装）
- 直接的なインフラストラクチャへの依存
- UIロジックの混入
