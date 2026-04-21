import { Loader2 } from 'lucide-react'

export default function Spinner({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">{message}</p>
        <p className="text-xs text-gray-400 mt-1">Fetching from FastAPI backend…</p>
      </div>
    </div>
  )
}

export function InlineSpinner() {
  return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
}
