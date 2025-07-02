import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * CSRF トークン情報の型定義
 */
interface CsrfTokenInfo {
  token: string;
  expiresAt: number;
  sessionId: string;
  tenantId?: string;
}

/**
 * CSRF ハンドラーの設定
 */
interface CsrfHandlerConfig {
  tokenHeaderName?: string;
  tokenEndpoint?: string;
  protectedPaths?: string[];
  retryCount?: number;
  debug?: boolean;
}

/**
 * CSRF エラーの型定義
 */
interface CsrfError extends Error {
  code: string;
  status?: number;
  response?: any;
}

/**
 * 企業級CSRF保護ハンドラー
 * 
 * Features:
 * - 自動CSRF トークン取得・更新
 * - Axios インターセプター統合
 * - トークン期限管理
 * - 自動リトライ機能
 * - 詳細ログ記録
 * - エラーハンドリング
 */
export class CsrfHandler {
  private tokenCache: CsrfTokenInfo | null = null;
  private tokenRefreshPromise: Promise<CsrfTokenInfo> | null = null;
  private initialized = false;
  private axiosInstance: AxiosInstance;
  
  private readonly config: Required<CsrfHandlerConfig>;
  
  constructor(
    axiosInstance: AxiosInstance,
    config?: CsrfHandlerConfig
  ) {
    this.axiosInstance = axiosInstance;
    this.config = {
      tokenHeaderName: 'X-CSRF-Token',
      tokenEndpoint: '/api/v1/csrf/token',
      protectedPaths: ['/api/v1/'],
      retryCount: 2,
      debug: false,
      ...config
    };
  }

  /**
   * CSRF保護を初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.debug('Initializing CSRF protection...');
      
      // Axiosインターセプターを設定
      this.setupRequestInterceptor();
      this.setupResponseInterceptor();
      
      // 初期トークンを取得
      await this.ensureValidToken();
      
      this.initialized = true;
      this.debug('CSRF protection initialized successfully');
      
    } catch (error) {
      this.error('Failed to initialize CSRF protection:', error);
      throw this.createCsrfError('CSRF_INIT_FAILED', 'Failed to initialize CSRF protection', error);
    }
  }

  /**
   * 有効なCSRFトークンを確保
   */
  private async ensureValidToken(): Promise<CsrfTokenInfo> {
    // キャッシュされたトークンが有効かチェック
    if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
      this.debug('Using cached CSRF token');
      return this.tokenCache;
    }

    // 既に更新中の場合は、そのPromiseを返す
    if (this.tokenRefreshPromise) {
      this.debug('Token refresh already in progress, waiting...');
      return this.tokenRefreshPromise;
    }

    // 新しいトークンを取得
    this.tokenRefreshPromise = this.fetchNewToken();
    
    try {
      const token = await this.tokenRefreshPromise;
      this.tokenCache = token;
      this.debug('CSRF token refreshed successfully', {
        sessionId: token.sessionId,
        expiresAt: new Date(token.expiresAt).toISOString()
      });
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * 新しいCSRFトークンを取得
   */
  private async fetchNewToken(): Promise<CsrfTokenInfo> {
    try {
      this.debug('Fetching new CSRF token...');
      
      const response: AxiosResponse<{
        success: boolean;
        data: CsrfTokenInfo;
        message: string;
      }> = await this.axiosInstance.post(this.config.tokenEndpoint);

      if (!response.data.success) {
        throw new Error(`Token fetch failed: ${response.data.message}`);
      }

      const tokenInfo = response.data.data;
      this.debug('New CSRF token fetched successfully', {
        sessionId: tokenInfo.sessionId,
        expiresAt: new Date(tokenInfo.expiresAt).toISOString()
      });

      return tokenInfo;
      
    } catch (error) {
      this.error('Failed to fetch CSRF token:', error);
      throw this.createCsrfError('CSRF_TOKEN_FETCH_FAILED', 'Failed to fetch CSRF token', error);
    }
  }

  /**
   * トークンの有効性をチェック
   */
  private isTokenValid(token: CsrfTokenInfo): boolean {
    // 期限の5分前を無効とする（バッファを持たせる）
    const bufferTime = 5 * 60 * 1000; // 5分
    const now = Date.now();
    const isValid = now < (token.expiresAt - bufferTime);
    
    if (!isValid) {
      this.debug('CSRF token expired or about to expire', {
        expiresAt: new Date(token.expiresAt).toISOString(),
        now: new Date(now).toISOString()
      });
    }
    
    return isValid;
  }

  /**
   * リクエストインターセプターを設定
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // 保護対象のパスかチェック
          if (!this.shouldProtectPath(config.url || '')) {
            return config;
          }

          // 安全なHTTPメソッドはスキップ
          const method = config.method?.toUpperCase();
          if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
            return config;
          }

          // CSRFトークンを取得して設定
          const tokenInfo = await this.ensureValidToken();
          config.headers = config.headers || {};
          config.headers[this.config.tokenHeaderName] = tokenInfo.token;

          this.debug('CSRF token added to request', {
            method,
            url: config.url,
            tokenHash: this.hashToken(tokenInfo.token)
          });

          return config;

        } catch (error) {
          this.error('Failed to add CSRF token to request:', error);
          throw error;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * レスポンスインターセプターを設定
   */
  private setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // レスポンスヘッダーから新しいCSRFトークンを取得
        const newToken = response.headers[this.config.tokenHeaderName.toLowerCase()];
        const newTokenExpires = response.headers['x-csrf-token-expires'];

        if (newToken && newTokenExpires) {
          // キャッシュされたトークンを更新
          if (this.tokenCache) {
            this.tokenCache.token = newToken;
            this.tokenCache.expiresAt = parseInt(newTokenExpires);
            
            this.debug('CSRF token updated from response header', {
              tokenHash: this.hashToken(newToken),
              expiresAt: new Date(parseInt(newTokenExpires)).toISOString()
            });
          }
        }

        return response;
      },
      async (error: AxiosError) => {
        // CSRF関連のエラーかチェック  
        if (this.isCsrfError(error)) {
          this.debug('CSRF error detected, attempting retry...', {
            status: error.response?.status,
            message: error.message
          });

          // トークンキャッシュをクリア
          this.tokenCache = null;

          // 元のリクエストがCSRF保護対象の場合、リトライ
          const originalRequest = error.config;
          if (originalRequest && !originalRequest._csrfRetryCount) {
            originalRequest._csrfRetryCount = 1;
            
            try {
              // 新しいトークンを取得
              const tokenInfo = await this.ensureValidToken();
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers[this.config.tokenHeaderName] = tokenInfo.token;

              this.debug('Retrying request with new CSRF token');
              return this.axiosInstance.request(originalRequest);
              
            } catch (retryError) {
              this.error('CSRF retry failed:', retryError);
              throw this.createCsrfError('CSRF_RETRY_FAILED', 'CSRF retry failed', retryError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * パスが保護対象かチェック
   */
  private shouldProtectPath(url: string): boolean {
    return this.config.protectedPaths.some(path => url.startsWith(path));
  }

  /**
   * CSRFエラーかどうかをチェック
   */
  private isCsrfError(error: AxiosError): boolean {
    if (error.response?.status === 403) {
      const errorMessage = (error.response?.data as any)?.message || error.message || '';
      return errorMessage.toLowerCase().includes('csrf');
    }
    return false;
  }

  /**
   * セッションのトークンをクリア
   */
  async clearSession(): Promise<void> {
    try {
      this.debug('Clearing CSRF session...');
      
      await this.axiosInstance.delete('/api/v1/csrf/session');
      this.tokenCache = null;
      this.tokenRefreshPromise = null;
      
      this.debug('CSRF session cleared successfully');
      
    } catch (error) {
      this.error('Failed to clear CSRF session:', error);
      throw this.createCsrfError('CSRF_SESSION_CLEAR_FAILED', 'Failed to clear session', error);
    }
  }

  /**
   * トークンのハッシュ値を計算（ログ用）
   */
  private hashToken(token: string): string {
    return token.substring(0, 8) + '...';
  }

  /**
   * CSRFエラーを作成
   */
  private createCsrfError(code: string, message: string, originalError?: any): CsrfError {
    const error = new Error(message) as CsrfError;
    error.code = code;
    error.name = 'CsrfError';
    
    if (originalError) {
      error.status = originalError.response?.status;
      error.response = originalError.response?.data;
      error.stack = originalError.stack || error.stack;
    }
    
    return error;
  }

  /**
   * デバッグログ出力
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[CSRF] ${message}`, data || '');
    }
  }

  /**
   * エラーログ出力
   */
  private error(message: string, error?: any): void {
    console.error(`[CSRF] ${message}`, error || '');
  }
}

// Axiosリクエスト設定を拡張（リトライカウント用）
declare module 'axios' {
  interface AxiosRequestConfig {
    _csrfRetryCount?: number;
  }
}
