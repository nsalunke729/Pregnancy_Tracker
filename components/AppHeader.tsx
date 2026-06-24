import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="bg-white/75 backdrop-blur-md border-b border-rose-100/70 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo mark */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-lg leading-none">🤰</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-900 leading-tight tracking-tight whitespace-nowrap truncate">
                Pregnancy Tracker
              </p>
              <p className="text-[10px] text-rose-400 font-medium leading-tight whitespace-nowrap truncate">
                Your daily companion ♥
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
