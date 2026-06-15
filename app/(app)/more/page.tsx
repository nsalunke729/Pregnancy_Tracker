'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Scale, Calendar, History, LogOut, ChevronRight, Settings, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function MorePage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const MENU_ITEMS = [
    { href: '/weight',       icon: Scale,    label: 'Weight Tracker'   },
    { href: '/appointments', icon: Calendar, label: 'Appointments'     },
    { href: '/history',      icon: History,  label: 'History'          },
    { href: '/guide',        icon: BookOpen, label: 'Symptom Guide'    },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">More</h1>
      </div>

      {/* Compact grouped list */}
      <Card className="overflow-hidden divide-y divide-gray-100">
        {MENU_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-rose-50/60 active:bg-rose-50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-rose-500" />
            </div>
            <span className="font-medium text-sm text-gray-900 flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
      </Card>

      {/* Sign out */}
      <Card className="overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 active:bg-red-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-medium text-sm flex-1 text-left">Sign Out</span>
        </button>
      </Card>
    </div>
  )
}
