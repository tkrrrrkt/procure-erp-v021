const http = require('http');
const https = require('https');
const { URL } = require('url');

const BACKEND_URL = 'http://localhost:3001';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAuthenticatedAPI() {
  console.log('🔐 認証済みAPIテスト開始');
  console.log('==========================================');
  
  try {
    // ブラウザのlocalStorageからトークンを取得する必要がある
    // 手動でトークンを入力してもらう
    console.log('📋 手順:');
    console.log('1. ブラウザでF12を押してDevToolsを開く');
    console.log('2. Consoleタブで以下を実行:');
    console.log('   localStorage.getItem("@@auth0spajs@@::y01U0CO0qzMTCKipxbdtrPh0DGopiOZQ::http://localhost:3001/api/v1::openid profile email")');
    console.log('3. 出力されたJSONの"body"フィールド内の"access_token"をコピー');
    console.log('4. このスクリプトを再実行時にトークンを引数として渡す');
    console.log('');
    console.log('実行例:');
    console.log('node authenticated-api-test.js "your-jwt-token-here"');
    console.log('');
    
    const token = process.argv[2];
    
    if (!token) {
      console.log('⚠️  JWTトークンが提供されていません。上記の手順でトークンを取得してください。');
      return;
    }
    
    console.log('🧪 認証済みAPIテスト実行中...');
    
    // ユーザープロファイル取得テスト
    const profileResponse = await makeRequest(`${BACKEND_URL}/api/v1/system/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (profileResponse.status === 200) {
      console.log('✅ ユーザープロファイル取得: 成功');
      console.log('📊 レスポンス:', JSON.stringify(profileResponse.data, null, 2));
    } else {
      console.log('❌ ユーザープロファイル取得: 失敗', profileResponse.status);
      console.log('📊 レスポンス:', profileResponse.data);
    }
    
    // 承認状態確認テスト
    const approvalResponse = await makeRequest(`${BACKEND_URL}/api/v1/system/user/approval-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (approvalResponse.status === 200) {
      console.log('✅ 承認状態確認: 成功');
      console.log('📊 レスポンス:', JSON.stringify(approvalResponse.data, null, 2));
    } else {
      console.log('❌ 承認状態確認: 失敗', approvalResponse.status);
      console.log('📊 レスポンス:', approvalResponse.data);
    }
    
    console.log('');
    console.log('🎉 認証済みAPIテスト完了！');
    
  } catch (error) {
    console.error('❌ 認証済みAPIテスト失敗:', error.message);
    
    if (error.message.includes('401')) {
      console.log('');
      console.log('💡 ヒント: トークンが無効または期限切れの可能性があります。');
      console.log('新しいトークンを取得して再試行してください。');
    }
  }
}

testAuthenticatedAPI();
