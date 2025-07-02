import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from '../exceptions/domain.exceptions';
import { SanitizerService } from '../services/sanitizer.service';

/**
 * 企業級バリデーションパイプ
 * セキュリティ強化・詳細ログ・マルチテナント対応
 */
@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(EnhancedValidationPipe.name);

  constructor(private readonly sanitizerService: SanitizerService) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // プリミティブ型は処理をスキップ
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 入力データサニタイゼーション
    const sanitizedValue = this.sanitizeInputData(value);

    // DTOクラスに変換
    const object = plainToClass(metatype, sanitizedValue);

    // バリデーション実行
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      // バリデーションエラーをログ記録
      this.logValidationErrors(errors, sanitizedValue);

      // エラーメッセージを構造化
      const validationErrors: Record<string, string[]> = {};
      
      errors.forEach(error => {
        const property = error.property;
        const messages: string[] = [];

        if (error.constraints) {
          Object.values(error.constraints).forEach(message => {
            messages.push(message);
          });
        }

        // 子オブジェクトのエラーも処理
        if (error.children && error.children.length > 0) {
          this.processChildErrors(error.children, messages, property);
        }

        validationErrors[property] = messages;
      });

      throw new ValidationException(validationErrors);
    }

    // 成功ログ記録
    this.logValidationSuccess(metatype.name, sanitizedValue);

    return object;
  }

  /**
   * 入力データサニタイゼーション
   */
  private sanitizeInputData(value: any): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    // オブジェクト全体をサニタイズ
    return this.sanitizerService.sanitizeObject(value, {
      html: true,
      sql: true,
      filename: true,
      url: true,
    });
  }

  /**
   * バリデーション対象判定
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * 子オブジェクトのバリデーションエラー処理
   */
  private processChildErrors(
    children: any[],
    messages: string[],
    parentProperty: string,
  ): void {
    children.forEach(child => {
      if (child.constraints) {
        Object.values(child.constraints).forEach(message => {
          messages.push(`${parentProperty}.${child.property}: ${message}`);
        });
      }

      if (child.children && child.children.length > 0) {
        this.processChildErrors(
          child.children,
          messages,
          `${parentProperty}.${child.property}`,
        );
      }
    });
  }

  /**
   * バリデーションエラーログ記録
   */
  private logValidationErrors(errors: any[], inputData: any): void {
    const errorSummary = errors.map(error => ({
      property: error.property,
      value: error.value,
      constraints: error.constraints,
    }));

    this.logger.warn('Validation failed', {
      errors: errorSummary,
      inputDataKeys: Object.keys(inputData || {}),
      timestamp: new Date().toISOString(),
    });

    // セキュリティ違反の可能性がある場合は詳細ログ
    const securityRelatedErrors = errors.filter(error =>
      error.constraints &&
      Object.values(error.constraints).some((msg: string) =>
        msg.toLowerCase().includes('security') ||
        msg.toLowerCase().includes('injection') ||
        msg.toLowerCase().includes('xss')
      )
    );

    if (securityRelatedErrors.length > 0) {
      this.logger.error('Potential security violation in input validation', {
        securityErrors: securityRelatedErrors,
        inputData: JSON.stringify(inputData).substring(0, 500),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * バリデーション成功ログ記録
   */
  private logValidationSuccess(dtoName: string, inputData: any): void {
    this.logger.log(`Validation successful for ${dtoName}`, {
      dtoName,
      fieldsCount: Object.keys(inputData || {}).length,
      timestamp: new Date().toISOString(),
    });
  }
}
