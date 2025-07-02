import DOMPurify from 'dompurify';

/**
 * 企業級クライアントサイドサニタイゼーション
 * XSS攻撃防止・入力データクリーニング
 */

/**
 * サニタイゼーション設定オプション
 */
export interface SanitizationOptions {
  /**
   * HTML要素を完全に除去するか
   */
  stripHtml?: boolean;
  
  /**
   * 最大文字数制限
   */
  maxLength?: number;
  
  /**
   * 空白文字をトリムするか
   */
  trim?: boolean;
  
  /**
   * SQLインジェクション対策文字をエスケープ
   */
  escapeSql?: boolean;
  
  /**
   * ファイル名安全化
   */
  sanitizeFilename?: boolean;
  
  /**
   * URL検証・正規化
   */
  sanitizeUrl?: boolean;
}

/**
 * サニタイゼーション統計情報
 */
interface SanitizationStats {
  htmlCleaned: number;
  sqlEscaped: number;
  filenameSanitized: number;
  urlSanitized: number;
  inputsCleaned: number;
  lastCleanedAt: Date;
}

/**
 * フロントエンドサニタイザークラス
 */
export class ClientSanitizer {
  private static stats: SanitizationStats = {
    htmlCleaned: 0,
    sqlEscaped: 0,
    filenameSanitized: 0,
    urlSanitized: 0,
    inputsCleaned: 0,
    lastCleanedAt: new Date(),
  };

  /**
   * HTML入力のサニタイゼーション
   * XSS攻撃防止のため危険なタグ・スクリプトを除去
   */
  static sanitizeHtml(input: string, allowTags: string[] = []): string {
    if (!input || typeof input !== 'string') return '';

    try {
      // DOMPurifyによるXSS防止
      const cleaned = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: allowTags,
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        SANITIZE_DOM: true,
      });

      this.stats.htmlCleaned++;
      this.stats.lastCleanedAt = new Date();

      return cleaned;
    } catch (error) {
      console.warn('🔒 HTML sanitization failed:', error);
      return input.replace(/<[^>]*>/g, ''); // フォールバック：全HTMLタグ除去
    }
  }

  /**
   * SQLインジェクション対策
   * 危険な文字をエスケープ
   */
  static escapeSqlCharacters(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let escaped = input
      .replace(/'/g, "''")           // シングルクォートエスケープ
      .replace(/"/g, '""')           // ダブルクォートエスケープ
      .replace(/\\/g, '\\\\')        // バックスラッシュエスケープ
      .replace(/--/g, '\\-\\-')      // SQLコメント無効化
      .replace(/\/\*/g, '\\/\\*')    // マルチラインコメント無効化
      .replace(/\*\//g, '\\*\\/')    // マルチラインコメント終了無効化
      .replace(/;/g, '\\;')          // セミコロン（ステートメント区切り）無効化
      .replace(/\x00/g, '\\0')       // NULL文字除去
      .replace(/\n/g, '\\n')         // 改行文字エスケープ
      .replace(/\r/g, '\\r')         // キャリッジリターンエスケープ
      .replace(/\x1a/g, '\\Z');      // substitute文字エスケープ

    // 危険なSQL関数・キーワードの検出と警告
    const dangerousPatterns = [
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi,
      /\b(UNION|JOIN|WHERE|FROM|INTO)\b/gi,
      /\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b/gi,
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(escaped)) {
        console.warn('🚨 Potential SQL injection attempt detected and neutralized');
      }
    });

    this.stats.sqlEscaped++;
    this.stats.lastCleanedAt = new Date();

    return escaped;
  }

  /**
   * ファイル名安全化
   * パストラバーサル攻撃防止・無効文字除去
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';

    let sanitized = filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')    // 無効文字を_に置換
      .replace(/^\.+/, '')                        // 先頭のドットを除去
      .replace(/\.+$/, '')                        // 末尾のドットを除去
      .replace(/\s+/g, '_')                       // 空白を_に置換
      .substring(0, 255);                         // 長さ制限

    // Windowsの予約語チェック
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    const baseName = sanitized.split('.')[0].toUpperCase();
    if (reservedNames.includes(baseName)) {
      sanitized = `safe_${sanitized}`;
    }

    this.stats.filenameSanitized++;
    this.stats.lastCleanedAt = new Date();

    return sanitized || 'untitled';
  }

  /**
   * URL検証・正規化
   * 危険なスキームをブロック・HTTPSエンフォース
   */
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    try {
      // 危険なスキームをブロック
      const dangerousSchemes = [
        'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'
      ];

      const lowercaseUrl = url.toLowerCase().trim();
      for (const scheme of dangerousSchemes) {
        if (lowercaseUrl.startsWith(scheme)) {
          console.warn('🔒 Blocked dangerous URL scheme:', scheme);
          return '';
        }
      }

      // URL正規化
      const urlObj = new URL(url);
      
      // 本番環境でHTTPSを強制
      if (process.env.NODE_ENV === 'production' && urlObj.protocol === 'http:') {
        urlObj.protocol = 'https:';
        console.info('🔒 Upgraded URL to HTTPS for production');
      }

      this.stats.urlSanitized++;
      this.stats.lastCleanedAt = new Date();

      return urlObj.toString();
    } catch (error) {
      console.warn('🔒 Invalid URL blocked:', url);
      return '';
    }
  }

  /**
   * 汎用入力文字列サニタイゼーション
   */
  static sanitizeInput(
    input: string, 
    options: SanitizationOptions = {}
  ): string {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input;

    // トリミング
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    // HTML除去
    if (options.stripHtml) {
      sanitized = this.sanitizeHtml(sanitized, []);
    }

    // SQL文字エスケープ
    if (options.escapeSql) {
      sanitized = this.escapeSqlCharacters(sanitized);
    }

    // ファイル名安全化
    if (options.sanitizeFilename) {
      sanitized = this.sanitizeFilename(sanitized);
    }

    // URL検証
    if (options.sanitizeUrl) {
      sanitized = this.sanitizeUrl(sanitized);
    }

    // 制御文字除去
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 長さ制限
    if (options.maxLength && options.maxLength > 0) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    this.stats.inputsCleaned++;
    this.stats.lastCleanedAt = new Date();

    return sanitized;
  }

  /**
   * オブジェクトの再帰的サニタイゼーション
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    options: SanitizationOptions = {}
  ): T {
    if (!obj || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized = { ...obj } as T;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        (sanitized as any)[key] = this.sanitizeInput(value, options);
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeObject(value, options);
      }
    }

    return sanitized;
  }

  /**
   * サニタイゼーション統計取得
   */
  static getStats(): SanitizationStats {
    return { ...this.stats };
  }

  /**
   * 統計リセット
   */
  static resetStats(): void {
    this.stats = {
      htmlCleaned: 0,
      sqlEscaped: 0,
      filenameSanitized: 0,
      urlSanitized: 0,
      inputsCleaned: 0,
      lastCleanedAt: new Date(),
    };
  }
}

/**
 * 便利関数エクスポート
 */
export const sanitizeHtml = ClientSanitizer.sanitizeHtml.bind(ClientSanitizer);
export const escapeSql = ClientSanitizer.escapeSqlCharacters.bind(ClientSanitizer);
export const sanitizeFilename = ClientSanitizer.sanitizeFilename.bind(ClientSanitizer);
export const sanitizeUrl = ClientSanitizer.sanitizeUrl.bind(ClientSanitizer);
export const sanitizeInput = ClientSanitizer.sanitizeInput.bind(ClientSanitizer);
export const sanitizeObject = ClientSanitizer.sanitizeObject.bind(ClientSanitizer);

export default ClientSanitizer;
