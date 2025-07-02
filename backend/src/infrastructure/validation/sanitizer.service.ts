import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FileValidationOptions {
  filename: string;
  size: number;
  mimetype: string;
}

export interface SanitizerOptions {
  maxLength?: number;
  strictMode?: boolean;
  preventSqlInjection?: boolean;
}

export interface SanitizerStatistics {
  htmlSanitized: number;
  threatsBlocked: number;
  sqlInjectionAttempts: number;
  fileValidationRuns: number;
  lastResetTime: Date;
}

@Injectable()
export class SanitizerService {
  private readonly logger = new Logger(SanitizerService.name);
  private statistics: SanitizerStatistics = {
    htmlSanitized: 0,
    threatsBlocked: 0,
    sqlInjectionAttempts: 0,
    fileValidationRuns: 0,
    lastResetTime: new Date()
  };

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sanitize HTML input to prevent XSS attacks
   */
  sanitizeHtml(input: string, options?: SanitizerOptions): string {
    if (!input) return '';

    const maxLength = options?.maxLength || this.getMaxInputLength();
    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    let sanitized = input;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*['""][^'"]*['"]/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: URLs in strict mode
    if (options?.strictMode || this.isStrictModeEnabled()) {
      sanitized = sanitized.replace(/data:/gi, '');
    }

    // Remove potentially dangerous attributes
    sanitized = sanitized.replace(/style\s*=\s*['""][^'"]*expression[^'"]*['"]/gi, '');

    // Update statistics
    this.statistics.htmlSanitized++;
    if (input !== sanitized) {
      this.statistics.threatsBlocked++;
    }

    this.logger.log('Input sanitization completed', {
      originalLength: input.length,
      sanitizedLength: sanitized.length,
      threatsDetected: input !== sanitized
    });

    return sanitized;
  }

  /**
   * Validate input for SQL injection patterns
   */
  validateSqlInjection(input: string): boolean {
    if (!input) return true;

    if (!this.isPreventsqlinjectionEnabled()) {
      return true;
    }

    const sqlPatterns = [
      /('|(\\');|''|(\"|\\\")|\"\")/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /(\s*(or|and)\s*\d+\s*=\s*\d+)/i,
      /(--|\#|\/\*|\*\/)/i,
      /(\s*(or|and)\s+\w+\s*=\s*\w+)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.logger.warn(`Potential SQL injection detected: ${input.substring(0, 50)}...`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: FileValidationOptions): boolean {
    // Check file extension
    const allowedExtensions = this.getAllowedExtensions();
    const fileExtension = file.filename.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      this.logger.warn(`Invalid file extension: ${fileExtension}`);
      return false;
    }

    // Check file size
    const maxSizeMB = this.getMaxFileSizeMB();
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.logger.warn(`File size exceeds limit: ${file.size} bytes`);
      return false;
    }

    // Check for double extension (security risk)
    const extensionMatches = file.filename.match(/\.[a-zA-Z0-9]+/g);
    if (extensionMatches && extensionMatches.length > 1) {
      this.logger.warn(`Double extension detected: ${file.filename}`);
      return false;
    }

    // Update statistics
    this.statistics.fileValidationRuns++;

    return true;
  }

  /**
   * Validate JSON depth to prevent deep nesting attacks
   */
  validateJsonDepth(obj: any, maxDepth?: number): boolean {
    const limit = maxDepth || this.getMaxJsonDepth();
    
    const getDepth = (o: any, depth = 0): number => {
      if (depth > limit) return depth;
      if (typeof o !== 'object' || o === null) return depth;
      
      let maxChildDepth = depth;
      for (const key in o) {
        if (o.hasOwnProperty(key)) {
          const childDepth = getDepth(o[key], depth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }
      return maxChildDepth;
    };

    const actualDepth = getDepth(obj);
    if (actualDepth > limit) {
      this.logger.warn(`JSON depth exceeds limit: ${actualDepth} > ${limit}`);
      return false;
    }

    return true;
  }

  /**
   * Comprehensive input validation
   */
  validateInput(input: string, options?: SanitizerOptions): string {
    if (!input) return '';

    // Length validation
    const maxLength = options?.maxLength || this.getMaxInputLength();
    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // SQL injection validation
    if (!this.validateSqlInjection(input)) {
      throw new Error('Input contains potential SQL injection patterns');
    }

    // HTML sanitization
    return this.sanitizeHtml(input, options);
  }

  /**
   * Detect potential SQL injection attempts
   */
  detectSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Check if SQL injection detection is enabled
    const isEnabled = this.configService.get<string>('SANITIZER_SQL_INJECTION_ENABLED', 'true') === 'true';
    if (!isEnabled) {
      return false;
    }

    // Common SQL injection patterns
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute|sp_|xp_)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
      /(eval|expression|alert|confirm|prompt)/i
    ];

    const hasSqlInjection = sqlPatterns.some(pattern => pattern.test(input));
    
    if (hasSqlInjection) {
      this.statistics.sqlInjectionAttempts++;
      this.logger.warn('SQL injection attempt detected', {
        input: input.substring(0, 100), // Log first 100 chars only
        timestamp: new Date().toISOString()
      });
    }

    return hasSqlInjection;
  }

  /**
   * Get sanitization statistics
   */
  getStatistics(): SanitizerStatistics {
    return { ...this.statistics };
  }

  /**
   * Reset sanitization statistics
   */
  resetStatistics(): void {
    this.statistics = {
      htmlSanitized: 0,
      threatsBlocked: 0,
      sqlInjectionAttempts: 0,
      fileValidationRuns: 0,
      lastResetTime: new Date()
    };
    
    this.logger.log('Sanitizer statistics have been reset');
  }

  // Configuration getters
  private getMaxInputLength(): number {
    return parseInt(this.configService.get('MAX_INPUT_LENGTH', '1000'));
  }

  private getMaxFileSizeMB(): number {
    return parseInt(this.configService.get('MAX_FILE_SIZE_MB', '10'));
  }

  private getAllowedExtensions(): string[] {
    const extensions = this.configService.get('ALLOWED_FILE_EXTENSIONS', 'jpg,jpeg,png,gif,pdf,doc,docx');
    return extensions.split(',').map((ext: string) => ext.trim().toLowerCase());
  }

  private isStrictModeEnabled(): boolean {
    return this.configService.get<string>('SANITIZER_STRICT_MODE', 'true') === 'true';
  }

  private isPreventsqlinjectionEnabled(): boolean {
    return this.configService.get('PREVENT_SQL_INJECTION', 'true') === 'true';
  }

  private getMaxJsonDepth(): number {
    return parseInt(this.configService.get('MAX_JSON_DEPTH', '10'));
  }
}
