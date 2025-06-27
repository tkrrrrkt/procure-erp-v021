# Shared Kernel（共有カーネル）

## 概要
共有カーネル層は、全レイヤーで共通して使用される基底クラス、インターフェース、ユーティリティ、型定義などを提供します。

## ディレクトリ構成

### domain/
ドメイン層の基底クラス
- **base-classes.ts**: エンティティ、値オブジェクトの基底クラス
- **value-object.ts**: 値オブジェクトの基底実装

### types/
共通型定義
- アプリケーション全体で使用する型
- ユーティリティ型
- ブランド型

### constants/
定数定義
- ビジネス定数
- システム定数
- エラーコード

### utils/
ユーティリティ関数
- 日付処理
- 文字列処理
- バリデーションヘルパー

### interfaces/
共通インターフェース
- 基本的なインターフェース定義
- ジェネリック型定義

### exceptions/
カスタム例外
- **domain.exceptions.ts**: ドメイン例外
- ビジネス例外
- システム例外

## 実装例

### 基底クラス
```typescript
// Entity基底クラス
export abstract class Entity<T> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): T {
    return this._id;
  }

  equals(object?: Entity<T>): boolean {
    if (object == null || object == undefined) {
      return false;
    }
    if (this === object) {
      return true;
    }
    if (!isEntity(object)) {
      return false;
    }
    return this._id === object._id;
  }
}

// ValueObject基底クラス
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
```

### 共通型定義
```typescript
// ブランド型
export type UUID = string & { readonly brand: unique symbol };
export type TenantId = string & { readonly brand: unique symbol };
export type UserId = string & { readonly brand: unique symbol };

// ページネーション型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Result型（エラーハンドリング用）
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };
```

### ドメイン例外
```typescript
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'EntityNotFoundException';
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(rule: string) {
    super(`Business rule violation: ${rule}`);
    this.name = 'BusinessRuleViolationException';
  }
}

export class InvalidArgumentException extends DomainException {
  constructor(argument: string, value: any) {
    super(`Invalid argument ${argument}: ${value}`);
    this.name = 'InvalidArgumentException';
  }
}
```

### ユーティリティ関数
```typescript
// UUID生成
export const generateUUID = (): UUID => {
  return crypto.randomUUID() as UUID;
};

// 日付フォーマット
export const formatDate = (date: Date, format: string): string => {
  // 実装
};

// 金額フォーマット
export const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
  }).format(amount);
};

// バリデーションヘルパー
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
```

## 設計原則

1. **不変性**
   - 共有される値は不変にする
   - Object.freezeの活用

2. **型安全性**
   - 厳密な型定義
   - ブランド型の活用

3. **再利用性**
   - 汎用的な実装
   - 特定のドメインに依存しない

4. **テスタビリティ**
   - 純粋関数の実装
   - 副作用の排除

## 使用上の注意

- ビジネスロジックは含まない
- 特定のフレームワークに依存しない
- 最小限の外部依存
- バージョン管理の考慮
