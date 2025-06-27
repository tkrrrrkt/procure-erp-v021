/**
 * Auth0 Post-Login Action
 * 組織情報とテナント情報をJWTトークンのカスタムクレームとして追加
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.procure-erp.com/';
  
  try {
    // 組織情報を取得
    const orgId = event.organization?.id;
    const orgName = event.organization?.display_name || event.organization?.name;
    
    if (orgId) {
      // カスタムクレームを追加
      api.idToken.setCustomClaim(`${namespace}org_id`, orgId);
      api.accessToken.setCustomClaim(`${namespace}org_id`, orgId);
      
      if (orgName) {
        api.idToken.setCustomClaim(`${namespace}org_name`, orgName);
        api.accessToken.setCustomClaim(`${namespace}org_name`, orgName);
      }
      
      // テナントIDとして組織IDを使用（マルチテナント対応）
      api.idToken.setCustomClaim(`${namespace}tenant_id`, orgId);
      api.accessToken.setCustomClaim(`${namespace}tenant_id`, orgId);
      
      console.log(`Added organization claims for user ${event.user.user_id}: org_id=${orgId}, org_name=${orgName}`);
    } else {
      console.warn(`No organization found for user ${event.user.user_id}`);
    }
    
    // ユーザーロールの追加（必要に応じて）
    if (event.authorization?.roles) {
      api.idToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
      api.accessToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
    }
    
  } catch (error) {
    console.error('Error in post-login action:', error);
  }
};
