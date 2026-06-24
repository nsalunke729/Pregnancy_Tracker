'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-14 left-0 right-0 z-40 safe-top">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <div className="bg-amber-500 text-white text-xs font-medium rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span>You&apos;re offline — some data may be out of date</span>
        </div>
      </div>
    </div>
  )
}
