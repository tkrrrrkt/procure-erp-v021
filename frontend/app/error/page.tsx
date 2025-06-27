"use client"

import { Suspense } from 'react'

function ErrorContent() {
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              アクセスエラー
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              正しいURLからアクセスしてください
            </p>
          </div>
        </div>
      </div>
    )
  }

  const urlParams = new URLSearchParams(window.location.search)
  const errorCode = urlParams.get('code')
  const errorMessage = urlParams.get('message')

  const getErrorDetails = () => {
    switch (errorCode) {
      case 'missing_organization':
        return {
          title: '組織パラメータが必要です',
          description: '正しい組織URLからアクセスしてください。',
          suggestion: 'システム管理者にお問い合わせください。'
        }
      case 'invalid_organization':
        return {
          title: '無効な組織です',
          description: 'この組織へのアクセス権限がありません。',
          suggestion: '正しい組織URLを確認してください。'
        }
      default:
        return {
          title: 'アクセスエラー',
          description: '不正なアクセスが検出されました。',
          suggestion: 'システム管理者にお問い合わせください。'
        }
    }
  }

  const errorDetails = getErrorDetails()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorDetails.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorDetails.description}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    セキュリティ保護
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{errorDetails.suggestion}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                戻る
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <h4 className="text-sm font-medium text-gray-800">デバッグ情報</h4>
                <p className="text-xs text-gray-600 mt-1">Error Code: {errorCode}</p>
                <p className="text-xs text-gray-600">Message: {errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
