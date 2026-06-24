import { BottomNav } from '@/components/BottomNav'
import { AppHeader } from '@/components/AppHeader'
import { OfflineBanner } from '@/components/OfflineBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <OfflineBanner />
      {/* pt-14 = header height; pb-24 = bottom nav + safe area */}
      <main className="max-w-lg mx-auto pt-14 pb-24 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
