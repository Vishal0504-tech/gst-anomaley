import { WifiOff, RefreshCw } from 'lucide-react'

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-5">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
        <WifiOff className="w-7 h-7 text-red-500" />
      </div>
      <div className="text-center max-w-sm">
        <h3 className="text-base font-bold text-gray-900">Unable to connect to backend</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Make sure the FastAPI server is running on{' '}
          <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
            http://localhost:8000
          </code>
        </p>
        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-mono text-left break-all">
            {error}
          </p>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      )}
    </div>
  )
}
