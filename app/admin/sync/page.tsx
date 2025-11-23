'use client'
import { useState } from 'react'

export default function SyncPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSync = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/espn/sync', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: String(error) })
    }
    setLoading(false)
  }
    const [incrementalLoading, setIncrementalLoading] = useState(false)
    const [incrementalResult, setIncrementalResult] = useState<any>(null)

    const handleIncrementalSync = async () => {
    setIncrementalLoading(true)
    try {
        const res = await fetch('/api/espn/sync-recent', { method: 'POST' })
        const data = await res.json()
        setIncrementalResult(data)
    } catch (error) {
        setIncrementalResult({ success: false, error: String(error) })
    }
    setIncrementalLoading(false)
    }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">ESPN Data Sync</h1>
        
        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Syncing...' : 'Sync ESPN Data'}
        </button>

        {result && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-white text-xl mb-4">
              {result.success ? '✅ Success' : '❌ Failed'}
            </h2>
            <pre className="text-white text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <button
            onClick={handleIncrementalSync}
            disabled={incrementalLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors ml-4"
        >
        {incrementalLoading ? 'Syncing...' : 'Quick Update (Recent Events)'}
        </button>

        {incrementalResult && (
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-white text-xl mb-4">
            {incrementalResult.success ? '✅ Quick Update Complete' : '❌ Failed'}
            </h2>
            <pre className="text-white text-sm overflow-auto">
            {JSON.stringify(incrementalResult, null, 2)}
            </pre>
        </div>
        )}
      </div>
    </div>
  )
}