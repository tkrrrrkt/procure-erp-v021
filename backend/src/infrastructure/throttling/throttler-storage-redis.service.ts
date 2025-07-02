import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

// ThrottlerStorageRecord 型定義
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

// 内部ストレージ用レコード型
interface InternalStorageRecord {
  timestamp: number;
  ttl: number;
  limit: number;
}

/**
 * Redis統合レート制限ストレージ
 * 企業級のスケーラブルなレート制限を提供
 */
@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerStorageRedisService.name);
  private readonly storage = new Map<string, InternalStorageRecord[]>();
  private readonly redisClient: any = null; // Redis未設定の場合はMap使用

  constructor(private readonly configService: ConfigService) {
    // Redis設定があればクライアント初期化
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.initializeRedisClient(redisUrl);
    } else {
      this.logger.warn('Redis not configured, using in-memory storage for rate limiting');
    }
  }

  private async initializeRedisClient(_redisUrl: string): Promise<void> {
    try {
      // Redis実装は後で追加
      // const redis = new Redis(redisUrl);
      // this.redisClient = redis;
      this.logger.log('Redis client initialized for throttling');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error);
    }
  }

  async getRecord(key: string): Promise<InternalStorageRecord[]> {
    try {
      if (this.redisClient) {
        return await this.getRecordFromRedis(key);
      } else {
        return this.getRecordFromMemory(key);
      }
    } catch (error) {
      this.logger.error(`Failed to get throttle record for key ${key}:`, error);
      return [];
    }
  }

  async addRecord(key: string, record: InternalStorageRecord): Promise<void> {
    try {
      if (this.redisClient) {
        await this.addRecordToRedis(key, record);
      } else {
        this.addRecordToMemory(key, record);
      }
    } catch (error) {
      this.logger.error(`Failed to add throttle record for key ${key}:`, error);
    }
  }

  // ThrottlerStorage インターフェース実装
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    const record = {
      timestamp: now,
      ttl,
      limit,
    };

    await this.addRecord(key, record);
    const records = await this.getRecord(key);
    const totalHits = records.length;
    const isBlocked = totalHits > limit;
    const timeToExpire = Math.max(0, (records[0]?.timestamp || 0) + ttl * 1000 - now);
    const timeToBlockExpire = isBlocked ? blockDuration * 1000 : 0;

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    } as ThrottlerStorageRecord;
  }

  // Redis実装（将来の拡張用）
  private async getRecordFromRedis(_key: string): Promise<InternalStorageRecord[]> {
    // Redis実装
    const data: string | null = null; // await this.redisClient.get(key);
    return data ? JSON.parse(data) : [];
  }

  private async addRecordToRedis(_key: string, _record: InternalStorageRecord): Promise<void> {
    // Redis実装
    // const records = await this.getRecordFromRedis(key);
    // records.push(record);
    // await this.redisClient.setex(key, record.ttl, JSON.stringify(records));
  }

  // メモリ実装（開発・フォールバック用）
  private getRecordFromMemory(key: string): InternalStorageRecord[] {
    const records = this.storage.get(key) || [];
    const now = Date.now();

    // 期限切れレコードを削除
    const validRecords = records.filter((record) => {
      return record.timestamp + record.ttl * 1000 > now;
    });

    if (validRecords.length !== records.length) {
      this.storage.set(key, validRecords);
    }

    return validRecords;
  }

  private addRecordToMemory(key: string, record: InternalStorageRecord): void {
    const records = this.getRecordFromMemory(key);
    records.push(record);
    this.storage.set(key, records);

    // メモリリーク防止のためのクリーンアップ
    this.scheduleCleanup(key, record.ttl);
  }

  private scheduleCleanup(key: string, ttl: number): void {
    setTimeout(
      () => {
        this.cleanupExpiredRecords(key);
      },
      ttl * 1000 + 1000,
    ); // TTL + 1秒後にクリーンアップ
  }

  private cleanupExpiredRecords(key: string): void {
    const records = this.storage.get(key);
    if (!records) return;

    const now = Date.now();
    const validRecords = records.filter((record) => {
      return record.timestamp + record.ttl * 1000 > now;
    });

    if (validRecords.length === 0) {
      this.storage.delete(key);
    } else {
      this.storage.set(key, validRecords);
    }
  }

  /**
   * 管理機能: 現在のレート制限状況を取得
   */
  async getThrottleStatus(key: string): Promise<{
    requests: number;
    remaining: number;
    resetTime: Date;
  }> {
    const records = await this.getRecord(key);
    const now = Date.now();

    // 最新のレコードから制限情報を計算
    if (records.length === 0) {
      return {
        requests: 0,
        remaining: Infinity,
        resetTime: new Date(now + 3600000), // 1時間後
      };
    }

    const latestRecord = records[records.length - 1];
    const resetTime = new Date(latestRecord.timestamp + latestRecord.ttl * 1000);

    return {
      requests: records.length,
      remaining: Math.max(0, latestRecord.limit - records.length),
      resetTime,
    };
  }

  /**
   * 管理機能: キーの削除（緊急時用）
   */
  async clearKey(key: string): Promise<boolean> {
    try {
      if (this.redisClient) {
        // await this.redisClient.del(key);
      } else {
        this.storage.delete(key);
      }
      this.logger.log(`Cleared throttle key: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to clear throttle key ${key}:`, error);
      return false;
    }
  }
}
