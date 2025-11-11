'use client'

// src/app/error.tsx
// 🛡️ 全局错误边界 - 捕获服务器端异常并显示友好错误页面

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台（生产环境可以发送到错误追踪服务）
    console.error('Application Error:', error)
  }, [error])

  // 检查是否是数据库连接错误
  const isDatabaseError =
    error.message?.includes('database') ||
    error.message?.includes('prisma') ||
    error.message?.includes('P1001') ||
    error.message?.includes("Can't reach database")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        {/* 错误图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* 错误标题 */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          {isDatabaseError ? '数据库连接错误' : '服务器错误'}
        </h1>

        {/* 错误描述 */}
        {isDatabaseError ? (
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 text-center">
              应用无法连接到数据库。这通常是因为环境变量配置错误。
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-red-800 font-semibold">可能的原因：</p>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li>DATABASE_URL 配置错误或未设置</li>
                <li>数据库服务器不可达</li>
                <li>网络连接问题</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="text-blue-800 font-semibold">修复步骤：</p>
              <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
                <li>检查 <code className="bg-blue-100 px-2 py-0.5 rounded">.env</code> 文件是否存在</li>
                <li>确认 DATABASE_URL 配置正确</li>
                <li>重启开发服务器</li>
              </ol>
            </div>

            <div className="text-center">
              <a
                href="https://github.com/YOUR_USERNAME/butternovel/blob/main/DATABASE_FIX.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                查看完整修复指南
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 text-center">
              抱歉，服务器遇到了一个意外错误。我们已经记录了这个问题。
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-mono text-gray-700 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            重试
          </button>

          <Link
            href="/"
            className="px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all text-center"
          >
            返回首页
          </Link>
        </div>

        {/* 帮助链接 */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            问题仍然存在？{' '}
            <a
              href="mailto:support@butternovel.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              联系技术支持
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
