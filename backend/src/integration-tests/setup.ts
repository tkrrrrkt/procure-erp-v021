import { config } from 'dotenv';

// テスト環境用の環境変数設定
config({ path: '.env.test' });

// グローバルテスト設定
global.console = {
  ...console,
  // テスト実行時のログ出力を制御
  log: process.env.VERBOSE_TESTS === 'true' ? console.log : jest.fn(),
  debug: process.env.VERBOSE_TESTS === 'true' ? console.debug : jest.fn(),
  info: process.env.VERBOSE_TESTS === 'true' ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// タイムアウト設定
jest.setTimeout(30000);

// テストデータベース接続設定
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.REDIS_URL = process.env.TEST_REDIS_URL || process.env.REDIS_URL;

// セキュリティテスト用の環境変数
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests';
process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'test-csrf-secret-for-integration-tests';
process.env.AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'test.auth0.com';
process.env.AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'test-audience';

// レート制限テスト用設定
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '20';
process.env.THROTTLE_SHORT_TTL = '15';
process.env.THROTTLE_SHORT_LIMIT = '10';
process.env.THROTTLE_LONG_TTL = '3600';
process.env.THROTTLE_LONG_LIMIT = '100';

// テスト開始時の初期化ログ
console.log('🧪 Integration Test Environment Initialized');
console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
console.log(`🔄 Redis: ${process.env.REDIS_URL ? 'Connected' : 'Not configured'}`);
console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
console.log(`🛡️ CSRF Secret: ${process.env.CSRF_SECRET ? 'Configured' : 'Not configured'}`);
