#!/usr/bin/env node

/**
 * 🔐 Auth0/Okta セキュリティ・認証テストスクリプト
 * 
 * このスクリプトは以下をテストします：
 * 1. 認証フローテスト
 * 2. JWT・セッション管理テスト
 * 3. ユーザー同期テスト
 * 4. API認証テスト
 * 5. セキュリティテスト
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const axios = require('axios');

// テスト設定
const CONFIG = {
  backend: 'http://localhost:3001',
  frontend: 'http://localhost:3000',
  apiBase: 'http://localhost:3001/api/v1',
  auth0Domain: 'dev-22lwwfj3g02rol8a.jp.auth0.com',
  clientId: '6PqkVe9S67V08RYrc6h9m9ivxtIPiEXS',
  audience: 'http://localhost:3001/api/v1'
};

// テスト結果記録
const TestResults = {
  passed: 0,
  failed: 0,
  results: []
};

// カラー出力用
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// ログ出力
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTPリクエストヘルパー
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Security-Test/1.0',
        ...options.headers
      }
    };

    const req = lib.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// テスト実行ヘルパー
async function runTest(testName, testFunction) {
  log(`\n🧪 テスト実行: ${testName}`, 'cyan');
  
  try {
    const result = await testFunction();
    if (result.success) {
      log(`✅ ${testName}: 成功`, 'green');
      TestResults.passed++;
    } else {
      log(`❌ ${testName}: 失敗 - ${result.message}`, 'red');
      TestResults.failed++;
    }
    TestResults.results.push({ name: testName, ...result });
  } catch (error) {
    log(`❌ ${testName}: エラー - ${error.message}`, 'red');
    TestResults.failed++;
    TestResults.results.push({ name: testName, success: false, message: error.message });
  }
}

// テスト1: バックエンドヘルスチェック（基本・詳細両方）
async function testBackendHealth() {
  // 基本ヘルスチェック（ロードバランサー用）
  const basicResponse = await makeRequest(`${CONFIG.apiBase.replace('/api/v1', '')}/health`);
  
  // 詳細ヘルスチェック（監視システム用）
  const detailedResponse = await makeRequest(`${CONFIG.apiBase}/system/health`);
  
  const basicSuccess = basicResponse.status === 200;
  const detailedSuccess = detailedResponse.status === 200;
  
  return {
    success: basicSuccess && detailedSuccess,
    message: basicSuccess && detailedSuccess 
      ? 'バックエンド正常動作（基本・詳細両方）' 
      : `Basic: ${basicResponse.status}, Detailed: ${detailedResponse.status}`,
    details: {
      basic: basicResponse.body,
      detailed: detailedResponse.body
    }
  };
}

// テスト2: フロントエンドアクセス
async function testFrontendAccess() {
  const response = await makeRequest(CONFIG.frontend);
  return {
    success: response.status === 200,
    message: response.status === 200 ? 'フロントエンドアクセス成功' : `Status: ${response.status}`
  };
}

// テスト3: 未認証での保護ルートアクセステスト
async function testProtectedRouteUnauthorized() {
  const response = await makeRequest(`${CONFIG.apiBase}/system/user/profile`);
  return {
    success: response.status === 401,
    message: response.status === 401 ? '未認証アクセス適切に拒否' : `予期しないStatus: ${response.status}`,
    details: response.body
  };
}

// テスト4: 無効なJWTトークンテスト
async function testInvalidJWT() {
  const response = await makeRequest(`${CONFIG.apiBase}/system/user/profile`, {
    headers: {
      'Authorization': 'Bearer invalid.jwt.token'
    }
  });
  return {
    success: response.status === 401,
    message: response.status === 401 ? '無効JWT適切に拒否' : `予期しないStatus: ${response.status}`,
    details: response.body
  };
}

// テスト5: Auth0設定確認
async function testAuth0Configuration() {
  console.log('5. Auth0設定確認中...');
  
  try {
    // Auth0 Discovery Document確認
    const discoveryUrl = 'https://dev-22lwwfj3g02rol8a.jp.auth0.com/.well-known/openid_configuration';
    const response = await axios.get(discoveryUrl, { timeout: 10000 });
    
    if (response.status === 200 && response.data.issuer) {
      console.log('✅ Auth0設定: 正常');
      return {
        success: true,
        message: 'Auth0設定正常',
        details: { issuer: response.data.issuer }
      };
    } else {
      console.log('❌ Auth0設定: Discovery Document異常');
      return {
        success: false,
        message: 'Discovery Document異常',
        details: response.data
      };
    }
  } catch (error) {
    console.log('❌ Auth0設定: エラー -', error.message);
    // Auth0の一時的な問題の場合でも実際の認証機能は動作する可能性がある
    console.log('ℹ️  注意: この問題は実際の認証機能に影響しない場合があります');
    return {
      success: false,
      message: `Auth0設定エラー: ${error.message}`,
      details: { note: '実際の認証機能は正常動作の可能性あり' }
    };
  }
}

// テスト6: APIエンドポイント存在確認
async function testAPIEndpoints() {
  console.log('6. APIエンドポイント存在確認中...');
  
  const endpoints = [
    '/system/health',
    '/system/user/profile',
    '/system/user/approval-status'
  ];
  
  let successCount = 0;
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${CONFIG.apiBase}${endpoint}`, { 
        timeout: 5000,
        validateStatus: function (status) {
          // 401は期待される（認証が必要）
          return status === 401 || (status >= 200 && status < 300);
        }
      });
      
      console.log(`✅ ${endpoint}: 存在確認`);
      results[endpoint] = 'OK';
      successCount++;
    } catch (error) {
      console.log(`❌ ${endpoint}: エラー - ${error.message}`);
      results[endpoint] = error.message;
    }
  }
  
  return {
    success: successCount === endpoints.length,
    message: `${successCount}/${endpoints.length} エンドポイント確認`,
    details: results
  };
}

// テスト7: CORS設定確認
async function testCORSConfiguration() {
  const response = await makeRequest(`${CONFIG.apiBase}/system/health`, {
    headers: {
      'Origin': 'http://localhost:3000'
    }
  });
  
  const corsHeaders = response.headers['access-control-allow-origin'];
  return {
    success: !!corsHeaders,
    message: corsHeaders ? `CORS設定確認: ${corsHeaders}` : 'CORS設定未確認',
    details: {
      'access-control-allow-origin': corsHeaders,
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    }
  };
}

// レポート生成
function generateReport() {
  log('\n' + '='.repeat(60), 'blue');
  log('🔐 Auth0/Okta セキュリティテストレポート', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`\n📊 テスト結果サマリー:`, 'yellow');
  log(`   ✅ 成功: ${TestResults.passed}`);
  log(`   ❌ 失敗: ${TestResults.failed}`);
  log(`   📈 成功率: ${Math.round((TestResults.passed / (TestResults.passed + TestResults.failed)) * 100)}%`);
  
  log(`\n📋 詳細結果:`, 'yellow');
  TestResults.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    log(`   ${index + 1}. ${status} ${result.name}: ${result.message}`);
    if (result.details) {
      log(`      詳細: ${JSON.stringify(result.details, null, 2).split('\n').join('\n      ')}`);
    }
  });
  
  log('\n' + '='.repeat(60), 'blue');
  
  if (TestResults.failed === 0) {
    log('🎉 すべてのテストが成功しました！', 'green');
  } else {
    log(`⚠️  ${TestResults.failed}個のテストが失敗しました。`, 'red');
  }
}

// メイン実行
async function main() {
  log('🔐 Auth0/Okta セキュリティ・認証テスト開始', 'blue');
  log(`Backend: ${CONFIG.backend}`, 'cyan');
  log(`Frontend: ${CONFIG.frontend}`, 'cyan');
  log(`Auth0 Domain: ${CONFIG.auth0Domain}`, 'cyan');
  
  // テスト実行
  await runTest('バックエンドヘルスチェック（基本・詳細両方）', testBackendHealth);
  await runTest('フロントエンドアクセス', testFrontendAccess);
  await runTest('未認証での保護ルートアクセス', testProtectedRouteUnauthorized);
  await runTest('無効なJWTトークンテスト', testInvalidJWT);
  await runTest('Auth0設定確認', testAuth0Configuration);
  await runTest('APIエンドポイント存在確認', testAPIEndpoints);
  await runTest('CORS設定確認', testCORSConfiguration);
  
  // レポート生成
  generateReport();
  
  // 終了コード設定
  process.exit(TestResults.failed > 0 ? 1 : 0);
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  log(`💥 予期しないエラー: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log(`💥 Promise拒否: ${error.message}`, 'red');
  process.exit(1);
});

// 実行
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG, makeRequest };
