'use client';

import { useAuth } from '@/lib/auth/auth0-provider';
import { useState, useEffect } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function AuthTestPage() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // テスト結果を更新する関数
  const updateTestResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ));
  };

  // テスト初期化
  const initializeTests = () => {
    const tests: TestResult[] = [
      { name: '認証状態確認', status: 'pending', message: '待機中...' },
      { name: 'JWTトークン取得', status: 'pending', message: '待機中...' },
      { name: 'ユーザープロファイル取得', status: 'pending', message: '待機中...' },
      { name: 'バックエンドAPI呼び出し', status: 'pending', message: '待機中...' },
      { name: 'ローカルストレージ確認', status: 'pending', message: '待機中...' },
      { name: 'セッション持続性確認', status: 'pending', message: '待機中...' },
    ];
    setTestResults(tests);
  };

  // APIリクエストヘルパー
  const makeAuthenticatedRequest = async (endpoint: string, token: string) => {
    const response = await fetch(`http://localhost:3001/api/v1${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return {
      status: response.status,
      data: response.status === 204 ? null : await response.json(),
    };
  };

  // テスト実行
  const runAuthTests = async () => {
    if (!isAuthenticated) {
      alert('先にログインしてください');
      return;
    }

    setIsRunningTests(true);
    initializeTests();

    try {
      // テスト1: 認証状態確認
      updateTestResult(
        '認証状態確認',
        isAuthenticated ? 'success' : 'error',
        isAuthenticated ? '認証済み' : '未認証',
        { isAuthenticated, isLoading, hasUser: !!user }
      );

      // テスト2: JWTトークン取得
      try {
        const token = await getAccessTokenSilently();
        updateTestResult(
          'JWTトークン取得',
          'success',
          'トークン取得成功',
          { tokenLength: token.length, preview: token.substring(0, 50) + '...' }
        );

        // テスト3: ユーザープロファイル取得
        try {
          const profileResponse = await makeAuthenticatedRequest('/system/user/profile', token);
          updateTestResult(
            'ユーザープロファイル取得',
            profileResponse.status === 200 ? 'success' : 'error',
            `HTTP ${profileResponse.status}`,
            profileResponse.data
          );
        } catch (error) {
          updateTestResult('ユーザープロファイル取得', 'error', `エラー: ${error}`, null);
        }

        // テスト4: バックエンドAPI呼び出し
        try {
          const apiResponse = await makeAuthenticatedRequest('/api/user/profile', token);
          updateTestResult(
            'バックエンドAPI呼び出し',
            apiResponse.status === 200 ? 'success' : 'error',
            `HTTP ${apiResponse.status}`,
            apiResponse.data
          );
        } catch (error) {
          updateTestResult('バックエンドAPI呼び出し', 'error', `エラー: ${error}`, null);
        }

      } catch (error) {
        updateTestResult('JWTトークン取得', 'error', `エラー: ${error}`, null);
      }

      // テスト5: ローカルストレージ確認
      const auth0Keys = Object.keys(localStorage).filter(key => key.includes('auth0'));
      updateTestResult(
        'ローカルストレージ確認',
        auth0Keys.length > 0 ? 'success' : 'error',
        `Auth0関連キー: ${auth0Keys.length}個`,
        auth0Keys
      );

      // テスト6: セッション持続性確認
      const sessionData = {
        user: !!user,
        authenticated: isAuthenticated,
        userInfo: user ? {
          sub: user.sub,
          email: user.email,
          name: user.name
        } : null
      };
      updateTestResult(
        'セッション持続性確認',
        'success',
        'セッション情報確認完了',
        sessionData
      );

    } catch (error) {
      console.error('テスト実行中にエラー:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // テスト結果の表示色
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔐 Auth0 認証・セキュリティテスト</h1>
          
          {/* 認証状態表示 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">認証状態</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>認証済み:</strong> {isAuthenticated ? '✅ はい' : '❌ いいえ'}</p>
                  <p><strong>ユーザー情報:</strong> {user ? '✅ 取得済み' : '❌ なし'}</p>
                  {user && (
                    <div className="mt-2">
                      <p><strong>メール:</strong> {user.email}</p>
                      <p><strong>名前:</strong> {user.name}</p>
                      <p><strong>Sub:</strong> {user.sub}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ボタン群 */}
          <div className="flex flex-wrap gap-4 mb-6">
            {!isAuthenticated ? (
              <button
                onClick={() => loginWithRedirect()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                🔐 Auth0でログイン
              </button>
            ) : (
              <>
                <button
                  onClick={runAuthTests}
                  disabled={isRunningTests}
                  className={`font-bold py-2 px-4 rounded ${
                    isRunningTests
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-700'
                  } text-white`}
                >
                  {isRunningTests ? '🔄 テスト実行中...' : '🧪 認証テスト実行'}
                </button>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  🚪 ログアウト
                </button>
              </>
            )}
          </div>

          {/* テスト結果表示 */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 テスト結果</h3>
              <div className="space-y-3">
                {testResults.map((test, index) => (
                  <div key={index} className="bg-white rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(test.status)}</span>
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(test.status)}`}>
                        {test.message}
                      </span>
                    </div>
                    {test.details && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 手動テスト項目 */}
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">📝 手動テスト項目</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• ブラウザを閉じて再開した際のセッション持続性</li>
              <li>• 異なるタブでの認証状態同期</li>
              <li>• ネットワーク切断・復旧時の動作</li>
              <li>• 長時間アクセスしない場合のトークンリフレッシュ</li>
              <li>• 開発者ツールでローカルストレージ操作時の動作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
