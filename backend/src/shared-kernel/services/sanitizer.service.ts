import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 企業級入力サニタイゼーションサービス
 * XSS、SQLインジェクション、ファイル名攻撃等のセキュリティ脅威を防止
 */
@Injectable()
export class SanitizerService {
  private readonly logger = new Logger(SanitizerService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * XSS攻撃防止のためのHTMLサニタイゼーション
   * 危険なHTMLタグ・属性・JavaScript実行コードを除去
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // 危険なHTMLタグを除去
    const dangerousTags = [
      'script', 'iframe', 'object', 'embed', 'form', 'input', 
      'button', 'textarea', 'select', 'option', 'meta', 'link',
      'style', 'title', 'head', 'html', 'body'
    ];

    let sanitized = input;

    // 危険なタグを除去
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // JavaScript実行コードを除去
    const jsPatterns = [
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
      /vbscript:/gi,
      /expression\s*\(/gi
    ];

    jsPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // HTML実体参照エスケープ
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    this.logSanitization('HTML', input, sanitized);
    return sanitized;
  }

  /**
   * SQLインジェクション対策のための文字列サニタイゼーション
   * 危険なSQL文字・キーワードを無害化
   */
  sanitizeSql(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // 危険なSQL文字をエスケープ
    let sanitized = input
      .replace(/'/g, "''")  // シングルクォートエスケープ
      .replace(/;/g, '\\;')  // セミコロンエスケープ
      .replace(/-{2,}/g, '')  // SQLコメント除去
      .replace(/\/\*[\s\S]*?\*\//g, ''); // マルチラインコメント除去

    // 危険なSQLキーワードパターンを検出・無害化
    const dangerousPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(\b(script|javascript|vbscript)\b)/gi,
      /(\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/gi,
      /(xp_|sp_)/gi
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        this.logger.warn(`Potential SQL injection attempt detected: ${input.substring(0, 100)}...`);
        sanitized = sanitized.replace(pattern, '***FILTERED***');
      }
    });

    this.logSanitization('SQL', input, sanitized);
    return sanitized;
  }

  /**
   * ファイル名サニタイゼーション
   * パストラバーサル攻撃・特殊文字攻撃を防止
   */
  sanitizeFileName(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // パストラバーサル攻撃防止
    sanitized = sanitized
      .replace(/\.\./g, '')  // 親ディレクトリ参照除去
      .replace(/[\/\\]/g, '')  // パス区切り文字除去
      .replace(/^\.+/, '')  // 先頭のドット除去
      .replace(/\.+$/, '');  // 末尾のドット除去

    // 危険な文字を除去
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');

    // Windows予約ファイル名チェック
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5',
      'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4',
      'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    const nameWithoutExt = sanitized.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      sanitized = `safe_${sanitized}`;
    }

    // 長さ制限（255文字）
    if (sanitized.length > 255) {
      const ext = sanitized.lastIndexOf('.') > 0 ? sanitized.substring(sanitized.lastIndexOf('.')) : '';
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }

    this.logSanitization('FileName', input, sanitized);
    return sanitized;
  }

  /**
   * 一般的な入力文字列サニタイゼーション
   * 制御文字・危険文字を除去
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // 制御文字除去（改行・タブは保持）
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 連続する空白を単一空白に変換
    sanitized = sanitized.replace(/\s+/g, ' ');

    // 先頭・末尾の空白除去
    sanitized = sanitized.trim();

    // 長すぎる入力を制限（デフォルト1000文字）
    const maxLength = this.configService.get<number>('INPUT_MAX_LENGTH', 1000);
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      this.logger.warn(`Input truncated due to length limit: ${maxLength}`);
    }

    this.logSanitization('Input', input, sanitized);
    return sanitized;
  }

  /**
   * URLサニタイゼーション
   * 危険なスキームやペイロードを除去
   */
  sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // 危険なスキームを除去
    const dangerousSchemes = [
      'javascript:', 'vbscript:', 'data:', 'file:', 'ftp:',
      'mailto:', 'tel:', 'sms:', 'callto:'
    ];

    dangerousSchemes.forEach(scheme => {
      if (sanitized.toLowerCase().startsWith(scheme)) {
        sanitized = '';
        this.logger.warn(`Dangerous URL scheme detected: ${scheme}`);
      }
    });

    // 相対URLの場合は空にする（セキュリティリスク）
    if (sanitized.startsWith('//') || sanitized.startsWith('./') || sanitized.startsWith('../')) {
      sanitized = '';
      this.logger.warn('Relative URL rejected for security');
    }

    // HTTPSのみ許可（本番環境）
    if (this.configService.get('NODE_ENV') === 'production') {
      if (sanitized && !sanitized.startsWith('https://')) {
        sanitized = '';
        this.logger.warn('Non-HTTPS URL rejected in production');
      }
    }

    this.logSanitization('URL', input, sanitized);
    return sanitized;
  }

  /**
   * 複合サニタイゼーション
   * オブジェクトの全プロパティを再帰的にサニタイズ
   */
  sanitizeObject<T extends Record<string, any>>(obj: T, options: {
    html?: boolean;
    sql?: boolean;
    filename?: boolean;
    url?: boolean;
  } = {}): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitizedObj = { ...obj } as T;

    Object.keys(sanitizedObj).forEach(key => {
      const value = (sanitizedObj as any)[key];

      if (typeof value === 'string') {
        let sanitized = this.sanitizeInput(value);

        if (options.html) {
          sanitized = this.sanitizeHtml(sanitized);
        }
        
        if (options.sql) {
          sanitized = this.sanitizeSql(sanitized);
        }
        
        if (options.filename && key.toLowerCase().includes('filename')) {
          sanitized = this.sanitizeFileName(sanitized);
        }
        
        if (options.url && (key.toLowerCase().includes('url') || key.toLowerCase().includes('link'))) {
          sanitized = this.sanitizeUrl(sanitized);
        }

        (sanitizedObj as any)[key] = sanitized;
      } else if (Array.isArray(value)) {
        (sanitizedObj as any)[key] = value.map(item => 
          typeof item === 'object' ? this.sanitizeObject(item, options) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        (sanitizedObj as any)[key] = this.sanitizeObject(value, options);
      }
    });

    return sanitizedObj;
  }

  /**
   * サニタイゼーション統計情報取得
   */
  getSanitizationStats(): {
    htmlSanitizations: number;
    sqlSanitizations: number;
    filenameSanitizations: number;
    inputSanitizations: number;
    urlSanitizations: number;
  } {
    return {
      htmlSanitizations: this.htmlSanitizations,
      sqlSanitizations: this.sqlSanitizations,
      filenameSanitizations: this.filenameSanitizations,
      inputSanitizations: this.inputSanitizations,
      urlSanitizations: this.urlSanitizations
    };
  }

  /**
   * サニタイゼーションログ記録
   */
  private logSanitization(type: string, original: string, sanitized: string): void {
    if (original !== sanitized) {
      this.logger.log(`${type} sanitization applied`, {
        type,
        originalLength: original.length,
        sanitizedLength: sanitized.length,
        changed: true
      });

      // 統計更新
      switch (type) {
        case 'HTML':
          this.htmlSanitizations++;
          break;
        case 'SQL':
          this.sqlSanitizations++;
          break;
        case 'FileName':
          this.filenameSanitizations++;
          break;
        case 'Input':
          this.inputSanitizations++;
          break;
        case 'URL':
          this.urlSanitizations++;
          break;
      }
    }
  }

  // 統計カウンター
  private htmlSanitizations = 0;
  private sqlSanitizations = 0;
  private filenameSanitizations = 0;
  private inputSanitizations = 0;
  private urlSanitizations = 0;
}
