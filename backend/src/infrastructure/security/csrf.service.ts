import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

/**
 * 企業級CSRF保護サービス
 * JWT + Auth0環境に最適化された高セキュリティCSRF保護機能
 * 
 * Features:
 * - ワンタイムトークンによるリプレイ攻撃防止
 * - タイミング攻撃耐性のある比較処理
 * - セッション・テナント連携
 * - 詳細セキュリティログ記録
 * - メモリ効率的なトークン管理
 */
@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);
  private readonly secret: string;
  private readonly tokenTtl: number;
  private readonly maxTokensPerSession: number;
  
  // アクティブトークン管理 (sessionId -> Set<tokenHash>)
  private readonly activeTokens = new Map<string, Set<string>>();
  
  // トークン期限管理 (tokenHash -> expiresAt)
  private readonly tokenExpiration = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('CSRF_SECRET')!;
    this.tokenTtl = this.configService.get<number>('CSRF_TOKEN_TTL', 24 * 60 * 60 * 1000); // 24時間
    this.maxTokensPerSession = this.configService.get<number>('CSRF_MAX_TOKENS_PER_SESSION', 10);

    if (!this.secret || this.secret.length < 32) {
      throw new Error('CSRF_SECRET must be at least 32 characters long');
    }

    this.logger.log('CSRF Service initialized', {
      tokenTtl: this.tokenTtl,
      maxTokensPerSession: this.maxTokensPerSession,
      secretLength: this.secret.length
    });
  }

  /**
   * 新しいCSRFトークンを生成
   */
  async generateToken(sessionId: string, tenantId?: string): Promise<{
    token: string;
    expiresAt: number;
  }> {
    try {
      const now = Date.now();
      const expiresAt = now + this.tokenTtl;
      const nonce = randomBytes(16).toString('hex');
      
      // トークンペイロード構築
      const payload = {
        sessionId,
        tenantId: tenantId || 'default',
        timestamp: now,
        expiresAt,
        nonce
      };

      // ペイロードの署名
      const payloadStr = JSON.stringify(payload);
      const signature = this.createSignature(payloadStr);
      
      // 最終トークン（Base64URL エンコード）
      const tokenData = {
        payload: Buffer.from(payloadStr).toString('base64url'),
        signature
      };
      
      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
      const tokenHash = this.hashToken(token);

      // セッション別トークン管理
      await this.addTokenToSession(sessionId, tokenHash, expiresAt);

      this.logger.debug('CSRF token generated', {
        sessionId,
        tenantId,
        tokenHash: tokenHash.substring(0, 8) + '...',
        expiresAt: new Date(expiresAt).toISOString(),
        activeTokensCount: this.activeTokens.get(sessionId)?.size || 0
      });

      return { token, expiresAt };

    } catch (error) {
      this.logger.error('Failed to generate CSRF token', {
        error: error.message,
        sessionId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * CSRFトークンを検証
   */
  async validateToken(
    token: string,
    sessionId: string,
    tenantId?: string
  ): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    try {
      if (!token || !sessionId) {
        return {
          isValid: false,
          reason: 'Token or session ID missing'
        };
      }

      // トークン形式検証
      const tokenHash = this.hashToken(token);
      const parseResult = this.parseToken(token);
      
      if (!parseResult.success) {
        this.logSecurityViolation('Invalid token format', {
          sessionId,
          tenantId,
          tokenHash: tokenHash.substring(0, 8) + '...',
          reason: parseResult.error
        });
        
        return {
          isValid: false,
          reason: parseResult.error
        };
      }

      if (!parseResult.success || !parseResult.data) {
        return {
          isValid: false,
          reason: 'Token format validation failed'
        };
      }
      
      const { payload, signature } = parseResult.data;

      // 署名検証
      const expectedSignature = this.createSignature(Buffer.from(payload, 'base64url').toString());
      if (!this.timingSafeCompare(signature, expectedSignature)) {
        this.logSecurityViolation('Invalid token signature', {
          sessionId,
          tenantId,
          tokenHash: tokenHash.substring(0, 8) + '...'
        });
        
        return {
          isValid: false,
          reason: 'Invalid signature'
        };
      }

      // ペイロード解析
      const payloadData = JSON.parse(Buffer.from(payload, 'base64url').toString());

      // セッションID検証
      if (payloadData.sessionId !== sessionId) {
        this.logSecurityViolation('Session ID mismatch', {
          sessionId,
          tokenSessionId: payloadData.sessionId,
          tenantId,
          tokenHash: tokenHash.substring(0, 8) + '...'
        });
        
        return {
          isValid: false,
          reason: 'Session mismatch'
        };
      }

      // テナントID検証
      const expectedTenantId = tenantId || 'default';
      if (payloadData.tenantId !== expectedTenantId) {
        this.logSecurityViolation('Tenant ID mismatch', {
          sessionId,
          tenantId,
          tokenTenantId: payloadData.tenantId,
          tokenHash: tokenHash.substring(0, 8) + '...'
        });
        
        return {
          isValid: false,
          reason: 'Tenant mismatch'
        };
      }

      // 期限検証
      if (Date.now() > payloadData.expiresAt) {
        this.logSecurityViolation('Expired token', {
          sessionId,
          tenantId,
          tokenHash: tokenHash.substring(0, 8) + '...',
          expiredAt: new Date(payloadData.expiresAt).toISOString()
        });
        
        return {
          isValid: false,
          reason: 'Token expired'
        };
      }

      // ワンタイム使用検証
      if (!this.isTokenActive(sessionId, tokenHash)) {
        this.logSecurityViolation('Token already used or not found', {
          sessionId,
          tenantId,
          tokenHash: tokenHash.substring(0, 8) + '...'
        });
        
        return {
          isValid: false,
          reason: 'Token already used'
        };
      }

      // トークンを無効化（ワンタイム使用）
      this.removeTokenFromSession(sessionId, tokenHash);

      this.logger.debug('CSRF token validated successfully', {
        sessionId,
        tenantId,
        tokenHash: tokenHash.substring(0, 8) + '...'
      });

      return { isValid: true };

    } catch (error) {
      this.logger.error('CSRF token validation error', {
        error: error.message,
        sessionId,
        tenantId
      });
      
      return {
        isValid: false,
        reason: 'Validation error'
      };
    }
  }

  /**
   * セッション内のすべてのトークンをクリア
   */
  async clearSessionTokens(sessionId: string): Promise<void> {
    try {
      const sessionTokens = this.activeTokens.get(sessionId);
      if (sessionTokens) {
        // トークン期限情報も削除
        sessionTokens.forEach(tokenHash => {
          this.tokenExpiration.delete(tokenHash);
        });
        
        this.activeTokens.delete(sessionId);
        
        this.logger.debug('Session tokens cleared', {
          sessionId,
          clearedCount: sessionTokens.size
        });
      }
    } catch (error) {
      this.logger.error('Failed to clear session tokens', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * 期限切れトークンをクリーンアップ
   */
  async cleanupExpiredTokens(): Promise<{ cleaned: number; remaining: number }> {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      // 期限切れトークンを特定
      const expiredTokens = new Set<string>();
      this.tokenExpiration.forEach((expiresAt, tokenHash) => {
        if (now > expiresAt) {
          expiredTokens.add(tokenHash);
        }
      });

      // セッションから期限切れトークンを削除
      this.activeTokens.forEach((tokens, sessionId) => {
        const beforeSize = tokens.size;
        expiredTokens.forEach(tokenHash => {
          if (tokens.has(tokenHash)) {
            tokens.delete(tokenHash);
            this.tokenExpiration.delete(tokenHash);
            cleanedCount++;
          }
        });
        
        // 空になったセッションを削除
        if (tokens.size === 0) {
          this.activeTokens.delete(sessionId);
        }
      });

      const remainingCount = this.tokenExpiration.size;

      this.logger.log('Expired tokens cleaned up', {
        cleanedCount,
        remainingCount,
        cleanupTime: new Date().toISOString()
      });

      return {
        cleaned: cleanedCount,
        remaining: remainingCount
      };

    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', {
        error: error.message
      });
      
      return { cleaned: 0, remaining: this.tokenExpiration.size };
    }
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    activeSessions: number;
    totalActiveTokens: number;
    averageTokensPerSession: number;
    memoryUsage: {
      activeTokensSize: number;
      expirationSize: number;
    };
  } {
    const activeSessions = this.activeTokens.size;
    const totalActiveTokens = this.tokenExpiration.size;
    const averageTokensPerSession = activeSessions > 0 ? totalActiveTokens / activeSessions : 0;

    return {
      activeSessions,
      totalActiveTokens,
      averageTokensPerSession: Math.round(averageTokensPerSession * 100) / 100,
      memoryUsage: {
        activeTokensSize: this.activeTokens.size,
        expirationSize: this.tokenExpiration.size
      }
    };
  }

  /**
   * 署名を作成
   */
  private createSignature(data: string): string {
    return createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');
  }

  /**
   * トークンをハッシュ化
   */
  private hashToken(token: string): string {
    return createHmac('sha256', this.secret)
      .update(token)
      .digest('hex');
  }

  /**
   * タイミング攻撃耐性のある文字列比較
   */
  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * トークンを解析
   */
  private parseToken(token: string): {
    success: boolean;
    data?: { payload: string; signature: string };
    error?: string;
  } {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
      
      if (!tokenData.payload || !tokenData.signature) {
        return {
          success: false,
          error: 'Missing payload or signature'
        };
      }

      return {
        success: true,
        data: tokenData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token format'
      };
    }
  }

  /**
   * セッションにトークンを追加
   */
  private async addTokenToSession(sessionId: string, tokenHash: string, expiresAt: number): Promise<void> {
    if (!this.activeTokens.has(sessionId)) {
      this.activeTokens.set(sessionId, new Set());
    }

    const sessionTokens = this.activeTokens.get(sessionId)!;
    
    // トークン数制限チェック
    if (sessionTokens.size >= this.maxTokensPerSession) {
      // 古いトークンを削除
      const oldestToken = sessionTokens.values().next().value;
      sessionTokens.delete(oldestToken);
      this.tokenExpiration.delete(oldestToken);
    }

    sessionTokens.add(tokenHash);
    this.tokenExpiration.set(tokenHash, expiresAt);
  }

  /**
   * トークンがアクティブかチェック
   */
  private isTokenActive(sessionId: string, tokenHash: string): boolean {
    const sessionTokens = this.activeTokens.get(sessionId);
    return sessionTokens ? sessionTokens.has(tokenHash) : false;
  }

  /**
   * セッションからトークンを削除
   */
  private removeTokenFromSession(sessionId: string, tokenHash: string): void {
    const sessionTokens = this.activeTokens.get(sessionId);
    if (sessionTokens) {
      sessionTokens.delete(tokenHash);
      this.tokenExpiration.delete(tokenHash);
      
      if (sessionTokens.size === 0) {
        this.activeTokens.delete(sessionId);
      }
    }
  }

  /**
   * セキュリティ違反をログ記録
   */
  private logSecurityViolation(type: string, details: any): void {
    this.logger.warn(`CSRF Security Violation: ${type}`, {
      violationType: type,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}
