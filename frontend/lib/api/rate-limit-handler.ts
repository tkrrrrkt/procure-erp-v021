/**
 * フロントエンド APIレート制限ハンドラー
 * 企業級のレート制限エラー処理とユーザー体験最適化
 */

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface RateLimitError extends Error {
  status: number;
  headers: Record<string, string>;
  rateLimitInfo?: RateLimitInfo;
}

export class RateLimitHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1秒
  private static readonly MAX_DELAY = 30000; // 30秒

  private requestQueue: Array<{
    url: string;
    options: RequestInit;
    resolve: (value: Response) => void;
    reject: (error: Error) => void;
    retryCount: number;
  }> = [];

  private isProcessingQueue = false;

  /**
   * レート制限エラーを検出
   */
  static isRateLimitError(error: any): error is RateLimitError {
    return error.status === 429 || error.message?.includes('Rate limit');
  }

  /**
   * レスポンスヘッダーからレート制限情報を抽出
   */
  static extractRateLimitInfo(headers: Headers): RateLimitInfo | null {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const resetTime = headers.get('X-RateLimit-Reset');
    const retryAfter = headers.get('Retry-After');

    if (!limit) return null;

    return {
      limit: parseInt(limit, 10),
      remaining: remaining ? parseInt(remaining, 10) : 0,
      resetTime: resetTime ? new Date(parseInt(resetTime, 10) * 1000) : new Date(Date.now() + 60000),
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    };
  }

  /**
   * 指数バックオフでリトライ
   */
  static calculateBackoffDelay(retryCount: number): number {
    const exponentialDelay = Math.min(
      RateLimitHandler.BASE_DELAY * Math.pow(2, retryCount),
      RateLimitHandler.MAX_DELAY
    );

    // ジッター追加（±25%のランダム要素）
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    return Math.max(1000, exponentialDelay + jitter);
  }

  /**
   * レート制限対応のfetchリクエスト
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        url,
        options,
        resolve,
        reject,
        retryCount: 0,
      });

      this.processQueue();
    });
  }

  /**
   * リクエストキューを処理
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await this.executeRequest(request);
    }

    this.isProcessingQueue = false;
  }

  /**
   * 個別リクエストを実行
   */
  private async executeRequest(request: {
    url: string;
    options: RequestInit;
    resolve: (value: Response) => void;
    reject: (error: Error) => void;
    retryCount: number;
  }): Promise<void> {
    try {
      const response = await fetch(request.url, request.options);

      if (response.status === 429) {
        await this.handleRateLimitError(request, response);
      } else {
        request.resolve(response);
      }
    } catch (error) {
      if (RateLimitHandler.isRateLimitError(error)) {
        await this.handleRateLimitError(request, null, error as RateLimitError);
      } else {
        request.reject(error as Error);
      }
    }
  }

  /**
   * レート制限エラーの処理
   */
  private async handleRateLimitError(
    request: {
      url: string;
      options: RequestInit;
      resolve: (value: Response) => void;
      reject: (error: Error) => void;
      retryCount: number;
    },
    response?: Response,
    error?: RateLimitError
  ): Promise<void> {
    if (request.retryCount >= RateLimitHandler.MAX_RETRIES) {
      const rateLimitError = new Error(this.generateUserFriendlyMessage(request.retryCount));
      (rateLimitError as any).status = 429;
      request.reject(rateLimitError);
      return;
    }

    // レート制限情報を取得
    const rateLimitInfo = response ? 
      RateLimitHandler.extractRateLimitInfo(response.headers) : 
      error?.rateLimitInfo;

    // 待機時間を計算
    const delay = rateLimitInfo?.retryAfter ? 
      rateLimitInfo.retryAfter * 1000 : 
      RateLimitHandler.calculateBackoffDelay(request.retryCount);

    // ユーザー通知
    this.notifyUser(request.retryCount, delay, rateLimitInfo);

    // 待機後にリトライ
    setTimeout(() => {
      request.retryCount++;
      this.requestQueue.unshift(request); // 優先的に再処理
      this.processQueue();
    }, delay);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージ生成
   */
  private generateUserFriendlyMessage(retryCount: number): string {
    if (retryCount === 0) {
      return 'リクエストが集中しています。少々お待ちください...';
    } else if (retryCount < 3) {
      return 'サーバーが混雑しています。自動的に再試行します...';
    } else {
      return 'サーバーの応答が遅くなっています。しばらくしてから再度お試しください。';
    }
  }

  /**
   * ユーザーへの通知
   */
  private notifyUser(retryCount: number, delay: number, rateLimitInfo?: RateLimitInfo | null): void {
    const message = this.generateUserFriendlyMessage(retryCount);
    const waitTime = Math.ceil(delay / 1000);

    // トースト通知やプログレスバーの表示
    console.log(`Rate Limit: ${message} (待機時間: ${waitTime}秒)`);

    // カスタムイベントを発火してUIコンポーネントに通知
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rateLimitNotification', {
        detail: {
          message,
          waitTime,
          retryCount,
          rateLimitInfo,
        }
      }));
    }
  }

  /**
   * レート制限状況の確認
   */
  static async checkRateLimitStatus(baseUrl: string): Promise<RateLimitInfo | null> {
    try {
      const response = await fetch(`${baseUrl}/api/system/rate-limit-status`, {
        method: 'HEAD',
      });

      return RateLimitHandler.extractRateLimitInfo(response.headers);
    } catch (error) {
      console.warn('Failed to check rate limit status:', error);
      return null;
    }
  }

  /**
   * APIクライアント用のファクトリーメソッド
   */
  static createApiClient(baseUrl: string): {
    get: (path: string, options?: RequestInit) => Promise<Response>;
    post: (path: string, body?: any, options?: RequestInit) => Promise<Response>;
    put: (path: string, body?: any, options?: RequestInit) => Promise<Response>;
    delete: (path: string, options?: RequestInit) => Promise<Response>;
  } {
    const handler = new RateLimitHandler();

    const createRequest = (method: string) => 
      async (path: string, body?: any, options: RequestInit = {}) => {
        const url = `${baseUrl}${path}`;
        const requestOptions: RequestInit = {
          ...options,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          requestOptions.body = JSON.stringify(body);
        }

        return handler.fetch(url, requestOptions);
      };

    return {
      get: createRequest('GET'),
      post: createRequest('POST'),
      put: createRequest('PUT'),
      delete: createRequest('DELETE'),
    };
  }
}
