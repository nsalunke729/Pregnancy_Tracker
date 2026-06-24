'use client'

import { RefreshCw, WifiOff } from 'lucide-react'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-7 h-7 text-rose-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Couldn&apos;t load this page</h1>
        <p className="text-sm text-gray-500 mb-5">
          Check your connection and try again. Your data is safe — it&apos;s saved on the server.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
