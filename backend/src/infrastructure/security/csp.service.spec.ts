import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CspService } from './csp.service';

describe('CspService', () => {
  let service: CspService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CspService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<CspService>(CspService);
    configService = module.get(ConfigService);

    // Default CSP configuration
    configService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'CSP_ENABLED': 'true',
        'CSP_REPORT_ONLY': 'false',
        'CSP_REPORT_URI': '/api/csp-report',
        'CSP_ALLOWED_DOMAINS': 'procureerp.com,cdn.jsdelivr.net',
        'CSP_HTTPS_ONLY': 'true',
        'CSP_NONCE_ENABLED': 'true',
        'HSTS_MAX_AGE': '31536000',
        'HSTS_INCLUDE_SUBDOMAINS': 'true',
        'HSTS_PRELOAD': 'true',
        'X_FRAME_OPTIONS': 'SAMEORIGIN',
        'X_CONTENT_TYPE_OPTIONS': 'nosniff',
        'REFERRER_POLICY': 'strict-origin-when-cross-origin',
        'PERMISSIONS_POLICY': 'geolocation=(), microphone=(), camera=()'
      };
      return config[key] || '';
    });
  });

  describe('CSP基本機能テスト', () => {
    it('デフォルトCSPポリシーの生成', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain("script-src 'self'");
      expect(policy).toContain("style-src 'self'");
      expect(policy).toContain("img-src 'self' data:");
    });

    it('nonce付きCSPポリシーの生成', () => {
      const { policy, nonce } = service.generateCspHeader();
      
      expect(nonce).toBeDefined();
      expect(nonce).toHaveLength(24); // Base64エンコードされた16バイト
      expect(policy).toContain(`'nonce-${nonce}'`);
    });

    it('CSP無効時の空ポリシー', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CSP_ENABLED') return 'false';
        return '';
      });

      const { policy } = service.generateCspHeader();
      expect(policy).toBe('');
    });

    it('report-onlyモードの適用', () => {
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          'CSP_ENABLED': 'true',
          'CSP_REPORT_ONLY': 'true',
          'CSP_REPORT_URI': '/api/csp-report'
        };
        return config[key] || '';
      });

      const { policy, reportOnly } = service.generateCspHeader();
      expect(reportOnly).toBe(true);
      expect(policy).toContain('report-uri /api/csp-report');
    });
  });

  describe('動的nonce生成テスト', () => {
    it('一意のnonce生成', () => {
      const nonces = new Set();
      
      // 100回のnonce生成で重複がないことを確認
      for (let i = 0; i < 100; i++) {
        const { nonce } = service.generateCspHeader();
        expect(nonces.has(nonce)).toBe(false);
        nonces.add(nonce);
      }
    });

    it('nonce形式の検証', () => {
      const { nonce } = service.generateCspHeader();
      
      // nonceが存在することを確認
      expect(nonce).toBeDefined();
      expect(nonce).not.toBeNull();
      
      // Base64形式の検証
      expect(nonce!).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(nonce!.length).toBeGreaterThan(16);
    });

    it('nonce無効時の動作', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CSP_NONCE_ENABLED') return 'false';
        return '';
      });

      const { policy, nonce } = service.generateCspHeader();
      expect(nonce).toBeUndefined();
      expect(policy).not.toContain('nonce-');
    });
  });

  describe('セキュリティヘッダー統合テスト', () => {
    it('HSTS ヘッダーの生成', () => {
      const headers = service.getSecurityHeaders();
      
      expect(headers['Strict-Transport-Security']).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );
    });

    it('X-Frame-Options ヘッダーの設定', () => {
      const headers = service.getSecurityHeaders();
      
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });

    it('X-Content-Type-Options ヘッダーの設定', () => {
      const headers = service.getSecurityHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('Referrer-Policy ヘッダーの設定', () => {
      const headers = service.getSecurityHeaders();
      
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('Permissions-Policy ヘッダーの設定', () => {
      const headers = service.getSecurityHeaders();
      
      expect(headers['Permissions-Policy']).toBe('geolocation=(), microphone=(), camera=()');
    });
  });

  describe('許可ドメイン設定テスト', () => {
    it('設定ドメインの適用', () => {
      configService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'CSP_ALLOWED_DOMAINS') return 'https://procureerp.com,https://cdn.jsdelivr.net';
        if (key === 'CSP_ENABLED') return 'true';
        if (key === 'CSP_NONCE_ENABLED') return 'true';
        if (key === 'CSP_HTTPS_ONLY') return 'true';
        return defaultValue || '';
      });
      
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain('https://procureerp.com');
      expect(policy).toContain('https://cdn.jsdelivr.net');
    });

    it('HTTPS強制の適用', () => {
      configService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'CSP_ENABLED') return 'true';
        if (key === 'CSP_HTTPS_ONLY') return 'true';
        if (key === 'CSP_NONCE_ENABLED') return 'true';
        return defaultValue || '';
      });

      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain('upgrade-insecure-requests');
    });

    it('HTTPS強制無効時の動作', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CSP_HTTPS_ONLY') return 'false';
        return '';
      });

      const { policy } = service.generateCspHeader();
      
      expect(policy).not.toContain('upgrade-insecure-requests');
    });
  });

  describe('CSP違反レポート機能テスト', () => {
    it('レポートURI設定の適用', () => {
      configService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'CSP_REPORT_URI') return '/api/csp-report';
        if (key === 'CSP_ENABLED') return 'true';
        if (key === 'CSP_NONCE_ENABLED') return 'true';
        if (key === 'CSP_HTTPS_ONLY') return 'true';
        return defaultValue || '';
      });
      
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain('report-uri /api/csp-report');
    });

    it('レポートURI未設定時の動作', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CSP_REPORT_URI') return '';
        return '';
      });

      const { policy } = service.generateCspHeader();
      
      expect(policy).not.toContain('report-uri');
    });
  });

  describe('厳格CSPポリシーテスト', () => {
    it('unsafe-inline の完全除去', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).not.toContain("'unsafe-inline'");
    });

    it('unsafe-eval の完全除去', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).not.toContain("'unsafe-eval'");
    });

    it('script-src の厳格設定', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("script-src 'self'");
      expect(policy).toContain("'nonce-");
      expect(policy).not.toContain("'unsafe-inline'");
    });

    it('style-src の厳格設定', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("style-src 'self'");
      expect(policy).toContain("'nonce-");
    });

    it('connect-src の制限設定', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("connect-src 'self'");
    });

    it('frame-ancestors の制限設定', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("frame-ancestors 'none'");
    });
  });

  describe('XSS防止テスト', () => {
    it('インラインスクリプト実行の防止', () => {
      const { policy } = service.generateCspHeader();
      
      // インラインスクリプトを防ぐためのnonce必須
      expect(policy).toContain("script-src 'self' 'nonce-");
      expect(policy).not.toContain("'unsafe-inline'");
    });

    it('インラインスタイルのnonce制御', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("style-src 'self' 'nonce-");
    });

    it('外部スクリプト読み込みの制限', () => {
      const { policy } = service.generateCspHeader();
      
      // 許可されたドメインのみ
      expect(policy).toContain("script-src 'self'");
    });
  });

  describe('データ漏洩防止テスト', () => {
    it('外部接続の制限', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("connect-src 'self'");
    });

    it('フレーム埋め込みの制限', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("frame-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
    });

    it('フォーム送信先の制限', () => {
      const { policy } = service.generateCspHeader();
      
      expect(policy).toContain("form-action 'self'");
    });
  });

  describe('パフォーマンステスト', () => {
    it('CSPヘッダー生成のパフォーマンス', () => {
      const startTime = Date.now();
      
      // 1000回のヘッダー生成
      for (let i = 0; i < 1000; i++) {
        service.generateCspHeader();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 1000回の生成が1秒以内に完了することを確認
      expect(duration).toBeLessThan(1000);
    });

    it('セキュリティヘッダー生成のパフォーマンス', () => {
      const startTime = Date.now();
      
      // 1000回のヘッダー生成
      for (let i = 0; i < 1000; i++) {
        service.getSecurityHeaders();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('設定読み取りエラー時のフォールバック', () => {
      configService.get.mockImplementation(() => {
        throw new Error('Config error');
      });

      // エラーが発生するとそのまま例外がスローされる
      expect(() => service.generateCspHeader()).toThrow('Config error');
    });

    it('nonce生成エラー時の処理', () => {
      const originalRandomBytes = require('crypto').randomBytes;
      require('crypto').randomBytes = jest.fn().mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      // nonce生成エラー時は例外がスローされる
      expect(() => service.generateCspHeader()).toThrow('Random generation failed');
      
      // 元のメソッドを復元
      require('crypto').randomBytes = originalRandomBytes;
    });
  });

  describe('設定駆動テスト', () => {
    it('本番環境設定の適用', () => {
      configService.get.mockImplementation((key: string) => {
        const productionConfig: Record<string, string> = {
          'CSP_ENABLED': 'true',
          'CSP_REPORT_ONLY': 'false',
          'CSP_HTTPS_ONLY': 'true',
          'HSTS_MAX_AGE': '31536000',
          'HSTS_INCLUDE_SUBDOMAINS': 'true',
          'HSTS_PRELOAD': 'true'
        };
        return productionConfig[key] || '';
      });

      const { policy } = service.generateCspHeader();
      const headers = service.getSecurityHeaders();
      
      expect(policy).toContain('upgrade-insecure-requests');
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
      expect(headers['Strict-Transport-Security']).toContain('preload');
    });

    it('開発環境設定の適用', () => {
      configService.get.mockImplementation((key: string) => {
        const devConfig: Record<string, string> = {
          'CSP_ENABLED': 'true',
          'CSP_REPORT_ONLY': 'true',
          'CSP_HTTPS_ONLY': 'false',
          'HSTS_MAX_AGE': '0'
        };
        return devConfig[key] || '';
      });

      const { policy, reportOnly } = service.generateCspHeader();
      const headers = service.getSecurityHeaders();
      
      expect(reportOnly).toBe(true);
      expect(policy).not.toContain('upgrade-insecure-requests');
      expect(headers['Strict-Transport-Security']).toContain('max-age=0');
    });
  });
});
