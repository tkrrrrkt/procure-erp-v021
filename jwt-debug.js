const jwt = process.argv[2];

if (!jwt) {
  console.log('使用方法: node jwt-debug.js "JWT_TOKEN"');
  process.exit(1);
}

// JWTデコード（検証なし）
function decodeJWT(token) {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  
  return { header, payload };
}

try {
  const decoded = decodeJWT(jwt);
  
  console.log('🔍 JWT トークン解析結果');
  console.log('================================');
  
  console.log('📋 Header:');
  console.log(JSON.stringify(decoded.header, null, 2));
  
  console.log('\n📋 Payload:');
  console.log(JSON.stringify(decoded.payload, null, 2));
  
  console.log('\n⏰ 有効期限チェック:');
  const now = Math.floor(Date.now() / 1000);
  const exp = decoded.payload.exp;
  const iat = decoded.payload.iat;
  
  console.log(`現在時刻: ${now} (${new Date(now * 1000).toISOString()})`);
  console.log(`発行時刻: ${iat} (${new Date(iat * 1000).toISOString()})`);
  console.log(`有効期限: ${exp} (${new Date(exp * 1000).toISOString()})`);
  console.log(`期限まで: ${exp - now}秒`);
  
  if (exp < now) {
    console.log('❌ トークンは期限切れです');
  } else {
    console.log('✅ トークンは有効期限内です');
  }
  
  console.log('\n🎯 重要な設定確認:');
  console.log(`Issuer (iss): ${decoded.payload.iss}`);
  console.log(`Audience (aud): ${JSON.stringify(decoded.payload.aud)}`);
  console.log(`Subject (sub): ${decoded.payload.sub}`);
  console.log(`Scope: ${decoded.payload.scope}`);
  
} catch (error) {
  console.error('❌ JWT解析エラー:', error.message);
}
