'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function FixAuthorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [diagnosisResults, setDiagnosisResults] = useState<any>(null)
  const [fixResults, setFixResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p>Loading...</p>
    </div>
  }

  if (!session || session.user?.role !== 'ADMIN') {
    router.push('/')
    return null
  }

  const handleDiagnose = async () => {
    setLoading(true)
    setError(null)
    setDiagnosisResults(null)

    try {
      const res = await fetch('/api/admin/fix-authors', {
        method: 'GET'
      })

      const data = await res.json()

      if (res.ok) {
        setDiagnosisResults(data.data)
      } else {
        setError(data.error || 'Failed to diagnose')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to diagnose')
    } finally {
      setLoading(false)
    }
  }

  const handleFix = async () => {
    if (!confirm('Are you sure you want to fix all invalid author IDs? This will update the database.')) {
      return
    }

    setLoading(true)
    setError(null)
    setFixResults(null)

    try {
      const res = await fetch('/api/admin/fix-authors', {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        setFixResults(data.data)
      } else {
        setError(data.error || 'Failed to fix')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fix')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fix Author IDs</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
          <div className="space-y-2 text-gray-700">
            <p>Some novels have invalid <code className="bg-gray-100 px-2 py-1 rounded">authorId</code> values that don't match any existing users.</p>
            <p>This causes:</p>
            <ul className="list-disc list-inside ml-4">
              <li>404 errors when clicking author names on novel pages</li>
              <li>"User not found" errors when trying to follow authors</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : '🔍 Diagnose'}
          </button>

          <button
            onClick={handleFix}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : '🔧 Fix All'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {diagnosisResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Diagnosis Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-semibold">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{diagnosisResults.totalUsers}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-semibold">Total Novels</p>
                <p className="text-2xl font-bold text-green-900">{diagnosisResults.totalNovels}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">Invalid Novels</p>
                <p className="text-2xl font-bold text-red-900">{diagnosisResults.invalidNovels}</p>
              </div>
            </div>

            {diagnosisResults.suggestedAdmin && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-800 mb-2">Suggested Admin User:</p>
                <div className="text-sm text-amber-700">
                  <p><strong>ID:</strong> {diagnosisResults.suggestedAdmin.id}</p>
                  <p><strong>Email:</strong> {diagnosisResults.suggestedAdmin.email}</p>
                  <p><strong>Name:</strong> {diagnosisResults.suggestedAdmin.name}</p>
                  <p><strong>Writer Name:</strong> {diagnosisResults.suggestedAdmin.writerName}</p>
                </div>
              </div>
            )}

            {diagnosisResults.invalidNovelsList && diagnosisResults.invalidNovelsList.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Invalid Novels:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diagnosisResults.invalidNovelsList.map((novel: any) => (
                        <tr key={novel.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{novel.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{novel.title}</td>
                          <td className="px-4 py-2 text-sm text-red-600 font-mono">{novel.authorId}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{novel.authorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {fixResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Fix Results</h2>

            {fixResults.fix?.message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">{fixResults.fix.message}</p>
              </div>
            )}

            {fixResults.fix?.selectedAdmin && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-800 mb-2">Updated all novels to use:</p>
                <div className="text-sm text-blue-700">
                  <p><strong>ID:</strong> {fixResults.fix.selectedAdmin.id}</p>
                  <p><strong>Email:</strong> {fixResults.fix.selectedAdmin.email}</p>
                  <p><strong>Name:</strong> {fixResults.fix.selectedAdmin.name}</p>
                  <p><strong>Writer Name:</strong> {fixResults.fix.selectedAdmin.writerName}</p>
                </div>
              </div>
            )}

            {fixResults.fix?.updateResults && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-semibold">Successfully Updated</p>
                    <p className="text-2xl font-bold text-green-900">{fixResults.fix.successCount}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-semibold">Failed</p>
                    <p className="text-2xl font-bold text-red-900">{fixResults.fix.failedCount}</p>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">Update Details:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Old Author ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Author ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fixResults.fix.updateResults.map((result: any) => (
                        <tr key={result.id} className={result.status === 'failed' ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm text-gray-900">{result.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{result.title}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              result.status === 'updated'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 font-mono">{result.oldAuthorId}</td>
                          <td className="px-4 py-2 text-sm text-green-600 font-mono">{result.newAuthorId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
