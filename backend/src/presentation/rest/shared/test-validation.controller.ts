import { Controller, Post, Body, Get, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, IAuth0User } from '../../../infrastructure/external-services/auth0/auth0.decorators';

@ApiTags('Test Validation')
@Controller('test-validation')
export class TestValidationController {
  
  @Post()
  @ApiOperation({ summary: 'テスト用入力検証エンドポイント' })
  @ApiResponse({ status: 201, description: 'バリデーション成功' })
  @ApiResponse({ status: 400, description: 'バリデーション失敗' })
  async testValidation(@Body() body: any, @CurrentUser() user: IAuth0User) {
    // 基本認証チェック
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const bodyStr = JSON.stringify(body);
    
    // XSS検査
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /eval\s*\(/gi,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(bodyStr)) {
        throw new BadRequestException('XSS attack detected');
      }
    }
    
    // SQLインジェクション検査
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|union|script)\b)/gi,
      /(\b(or|and)\b.*?[=<>].*?(\b(select|insert|update|delete|drop|create|alter|exec|union|script)\b))/gi,
      /['";].*?(\b(select|insert|update|delete|drop|create|alter|exec|union|script)\b)/gi,
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(bodyStr)) {
        throw new BadRequestException('SQL injection detected');
      }
    }
    
    // 過大入力チェック
    if (bodyStr.length > 5000) {
      throw new BadRequestException('Input too large');
    }
    
    // サニタイズ処理（基本的なHTML除去）
    const sanitized = JSON.parse(bodyStr.replace(/<[^>]*>/g, ''));
    
    return { 
      success: true, 
      message: 'Validation passed',
      sanitized,
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'テスト用ヘルスチェック' })
  async testHealth() {
    return { 
      status: 'ok', 
      service: 'test-validation',
      timestamp: new Date().toISOString() 
    };
  }
}
