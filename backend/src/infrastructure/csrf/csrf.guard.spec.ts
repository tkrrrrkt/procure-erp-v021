import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from '../security/csrf.guard';
import { CsrfService } from '../security/csrf.service';
import { Request, Response } from 'express';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let csrfService: jest.Mocked<CsrfService>;
  let reflector: jest.Mocked<Reflector>;

  // モック実行コンテキスト作成ヘルパー
  const createMockContext = (
    method: string = 'POST',
    csrfToken?: string,
    sessionId?: string,
    tenantId?: string,
    skipCsrf: boolean = false,
    authenticated: boolean = true
  ): ExecutionContext => {
    const request = {
      method,
      headers: {
        'x-csrf-token': csrfToken
      },
      body: csrfToken ? {
        _csrf: csrfToken
      } : undefined,
      session: sessionId ? { id: sessionId } : undefined,
      user: authenticated ? {
        sub: sessionId || 'default-user-id',
        tenant_id: tenantId,
        tenantId: tenantId,
        'https://procure-erp.com/tenant': tenantId || 'default-tenant'
      } : undefined,
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'Jest Test Agent';
        if (header === 'x-forwarded-for') return '127.0.0.1';
        return undefined;
      })
    } as unknown as Request;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          set: jest.fn(),
          setHeader: jest.fn()
        } as unknown as Response)
      }),
      getHandler: () => skipCsrf ? { skipCsrf: true } : {},
      getClass: () => ({})
    } as any;
  };

  beforeEach(async () => {
    const mockCsrfService = {
      validateToken: jest.fn(),
      generateToken: jest.fn(),
      cleanupExpiredTokens: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfGuard,
        {
          provide: CsrfService,
          useValue: mockCsrfService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<CsrfGuard>(CsrfGuard);
    csrfService = module.get(CsrfService) as jest.Mocked<CsrfService>;
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
  });

  describe('基本CSRF保護テスト', () => {
    it('有効なCSRFトークンで通過', async () => {
      const context = createMockContext('POST', 'valid-token', 'session123', 'tenant1', false, true);

      // CSRFサービスのモックレスポンス設定
      csrfService.validateToken.mockResolvedValue({
        isValid: true,
        reason: 'Token is valid'
      });

      csrfService.generateToken.mockResolvedValue({
        token: 'new-token',
        expiresAt: Date.now() + 3600000
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(csrfService.validateToken).toHaveBeenCalledWith(
        'valid-token',
        'session123',
        'tenant1'
      );
    });

    it('無効なCSRFトークンで拒否', async () => {
      const context = createMockContext('POST', 'invalid-token', 'session123', 'tenant1');
      
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // skipCsrf
        .mockReturnValueOnce(false); // isPublic
      
      csrfService.validateToken.mockResolvedValue({ isValid: false, reason: 'Invalid token' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(csrfService.validateToken).toHaveBeenCalledWith(
        'invalid-token',
        'session123',
        'tenant1'
      );
    });

    it('CSRFトークン不在で拒否', async () => {
      const context = createMockContext('POST', undefined, 'session123', 'tenant1');

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // skipCsrf
        .mockReturnValueOnce(false); // isPublic

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    }); 

    it('認証なしユーザーで拒否', async () => {
      const context = createMockContext('POST', 'token', 'session123', 'tenant1', false, false);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('HTTPメソッド別テスト', () => {
    beforeEach(() => {
      reflector.getAllAndOverride
        .mockReturnValue(false); // skipCsrf = false
    });

    it('GET リクエストの自動通過', async () => {
      const context = createMockContext('GET');
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('HEAD リクエストの自動通過', async () => {
      const context = createMockContext('HEAD');
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('OPTIONS リクエストの自動通過', async () => {
      const context = createMockContext('OPTIONS');
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('POST リクエストでCSRF検証実行', async () => {
      const context = createMockContext('POST', 'test-token', 'session123', 'tenant1');
      
      csrfService.validateToken.mockResolvedValue({
        isValid: true,
        reason: 'Token is valid'
      });
      
      csrfService.generateToken.mockResolvedValue({
        token: 'new-token',
        expiresAt: Date.now() + 3600000
      });

      const result = await guard.canActivate(context);
      expect(csrfService.validateToken).toHaveBeenCalledWith('test-token', 'session123', 'tenant1');
      expect(result).toBe(true);
    });

    it('PUT リクエストでCSRF検証実行', async () => {
      const context = createMockContext('PUT', 'put-token', 'session456', 'tenant2');
      
      csrfService.validateToken.mockResolvedValue({
        isValid: true,
        reason: 'Token is valid'
      });
      
      csrfService.generateToken.mockResolvedValue({
        token: 'new-put-token',
        expiresAt: Date.now() + 3600000
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('DELETE リクエストでCSRF検証実行', async () => {
      const context = createMockContext('DELETE', 'delete-token', 'session789', 'tenant3');
      
      csrfService.validateToken.mockResolvedValue({
        isValid: true,
        reason: 'Token is valid'
      });
      
      csrfService.generateToken.mockResolvedValue({
        token: 'new-delete-token',
        expiresAt: Date.now() + 3600000
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    }); 
  });

  describe('CSRFスキップデコレーターテスト', () => {
    it('@SkipCsrf デコレーターで保護無効化', async () => {
      const context = createMockContext('POST', undefined, 'session123', 'tenant1');
      
      reflector.getAllAndOverride.mockReturnValue(true); // skipCsrf = true

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(csrfService.validateToken).not.toHaveBeenCalled();
    });

    it('@Public デコレーターで保護無効化', async () => {
      const context = createMockContext('POST', undefined, 'session123', 'tenant1');
      
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // skipCsrf = false
        .mockReturnValueOnce(true);  // isPublic = true

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(csrfService.validateToken).not.toHaveBeenCalled();
    });
  });

  describe('マルチテナント機能テスト', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('異なるテナント間でのトークン分離', async () => {
      const tenant1Context = createMockContext('POST', 'tenant1-token', 'session123', 'tenant1');
      const tenant2Context = createMockContext('POST', 'tenant1-token', 'session123', 'tenant2');
      
      csrfService.validateToken
        .mockResolvedValueOnce({ isValid: true, reason: 'Valid for tenant1' }) // tenant1で有効
        .mockResolvedValueOnce({ isValid: false, reason: 'Invalid for tenant2' }); // tenant2で無効

      csrfService.generateToken.mockResolvedValue({
        token: 'new-token',
        expiresAt: Date.now() + 3600000
      });

      await expect(guard.canActivate(tenant1Context)).resolves.toBe(true);
      await expect(guard.canActivate(tenant2Context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('エラーハンドリングテスト', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('CSRFサービスエラーの適切な処理', async () => {
      const context = createMockContext('POST', 'token', 'session123', 'tenant1');
      
      csrfService.validateToken.mockRejectedValue(new Error('Service error'));

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('予期しない例外の適切な処理', async () => {
      const context = createMockContext('POST', 'token', 'session123', 'tenant1');
      
      csrfService.validateToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('統合シナリオテスト', () => {
    it('実際のブラウザフローシミュレーション', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      // 1. 初回GET（CSRFトークン不要）
      const getContext = createMockContext('GET');
      expect(await guard.canActivate(getContext)).toBe(true);

      // 2. フォーム送信（POSTリクエスト）- CSRF必要
      const postContext = createMockContext('POST', 'form-token', 'browser-session', 'tenant1');
      
      csrfService.validateToken.mockResolvedValue({ isValid: true, reason: 'Valid token' });
      csrfService.generateToken.mockResolvedValue({
        token: 'new-form-token',
        expiresAt: Date.now() + 3600000
      });

      await expect(guard.canActivate(postContext)).resolves.toBe(true);

      // 3. AJAX更新（PUTリクエスト）- CSRF必要
      const ajaxContext = createMockContext('PUT', 'ajax-token', 'browser-session', 'tenant1');
      
      csrfService.validateToken.mockResolvedValue({ isValid: true, reason: 'Valid ajax token' });
      csrfService.generateToken.mockResolvedValue({
        token: 'new-ajax-token',
        expiresAt: Date.now() + 3600000
      });

      await expect(guard.canActivate(ajaxContext)).resolves.toBe(true);
    });

    it('セッション期限切れシナリオ', async () => {
      const context = createMockContext('POST', 'token', 'expired-session', 'tenant1');
      
      reflector.getAllAndOverride.mockReturnValue(false);
      csrfService.validateToken.mockRejectedValue(new Error('Session expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});
