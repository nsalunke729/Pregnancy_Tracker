'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scale, Calendar, History, LogOut } from 'lucide-react'
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
    { href: '/weight',       icon: Scale,    label: 'Weight Tracker',    desc: 'Log weight & view chart' },
    { href: '/appointments', icon: Calendar, label: 'Appointments',      desc: 'Doctor visits & scans' },
    { href: '/history',      icon: History,  label: 'History Calendar',  desc: 'View past logs' },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">More</h1>
      </div>

      <div className="space-y-2">
        {MENU_ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}>
            <Card className="active:scale-98 transition-transform">
              <CardBody className="flex items-center gap-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <span className="ml-auto text-gray-300">›</span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-4">
        <Button variant="danger" size="lg" className="w-full" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
