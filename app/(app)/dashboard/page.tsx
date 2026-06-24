'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateWeek, daysUntilDue, formatDueDate, getFruitSize } from '@/lib/pregnancy'
import { Pregnancy } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, Pill, Baby, Scale, Calendar, Copy, BookOpen } from 'lucide-react'
import { WelcomeTour } from '@/components/WelcomeTour'

export default function DashboardPage() {
  const router = useRouter()
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [showTour,  setShowTour]  = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data }, { data: profile }] = await Promise.all([
        supabase
          .from('pregnancies').select('*')
          .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
          .order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('profiles').select('tour_seen').eq('id', user.id).single(),
      ])

      if (!data) { router.push('/onboarding'); return }
      setPregnancy(data)
      if (profile && profile.tour_seen === false) setShowTour(true)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleTourComplete() {
    setShowTour(false)
    if (!userId) return
    const supabase = createClient()
    await supabase.from('profiles').update({ tour_seen: true }).eq('id', userId)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-4xl animate-pulse">🤰</div>
    </div>
  )

  if (!pregnancy) return null

  const week  = calculateWeek(pregnancy.lmp_date)
  const days  = daysUntilDue(pregnancy.due_date)
  const fruit = getFruitSize(week)
  const pct   = Math.min(100, Math.round((week / 40) * 100))
  const tri   = week <= 12 ? '1' : week <= 26 ? '2' : '3'

  async function copyCode() {
    await navigator.clipboard.writeText(pregnancy!.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const QUICK_ACTIONS = [
    { href: '/log',          icon: ClipboardList, label: 'Log',   color: 'bg-rose-50 text-rose-500' },
    { href: '/medicines',    icon: Pill,          label: 'Meds',  color: 'bg-purple-50 text-purple-500' },
    { href: '/kicks',        icon: Baby,          label: 'Kicks', color: 'bg-blue-50 text-blue-500' },
    { href: '/weight',       icon: Scale,         label: 'Wt.',   color: 'bg-green-50 text-green-500' },
    { href: '/appointments', icon: Calendar,      label: 'Appts', color: 'bg-orange-50 text-orange-500' },
  ]

  return (
    <div className="p-4 space-y-3">
      {showTour && <WelcomeTour onComplete={handleTourComplete} />}

      {/* Page title */}
      <div className="pt-3 pb-1">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
          <span className="flex-1 min-w-0 truncate">
            {pregnancy.baby_name ? `Hello, ${pregnancy.baby_name}!` : 'Good day!'}
          </span>
          <span className="flex-shrink-0">{pregnancy.baby_name ? '👋' : '🌸'}</span>
        </h1>
      </div>

      {/* ── Compact hero card: week + fruit + progress + due date ── */}
      <Card className="bg-gradient-to-br from-rose-400 to-rose-600 text-white border-0">
        <CardBody className="py-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-rose-200 text-[11px] font-medium uppercase tracking-wider">Week</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold leading-none">{week}</span>
                <span className="text-rose-300 text-sm">/ 40</span>
              </div>
              <p className="text-rose-100 text-xs mt-1">Trimester {tri}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl">{fruit.emoji}</div>
              <p className="text-white text-xs font-semibold">{fruit.fruit}</p>
              <p className="text-rose-200 text-[10px]">{fruit.size}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>

          {/* Bottom: pct + due date + days */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-200">{pct}% complete</span>
            <span className="text-white/90 font-medium">{days}d · {formatDueDate(pregnancy.due_date)}</span>
          </div>
        </CardBody>
      </Card>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Quick Actions</p>
        <div className="grid grid-cols-5 gap-1.5">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <div className="bg-white/90 rounded-xl border border-gray-100 py-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] font-semibold text-gray-700 leading-none">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Symptom Guide shortcut ── */}
      <Link href="/guide">
        <div className="bg-gradient-to-r from-violet-50 to-rose-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-98 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Symptom Guide</p>
          </div>
        </div>
      </Link>

      {/* ── Partner Code ── */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-700">Partner Code</p>
              <p className="text-[11px] text-gray-400">Share to let your partner join</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-widest text-rose-500">{pregnancy.join_code}</span>
              <Button size="icon" variant="secondary" onClick={copyCode}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {copied && <p className="text-[11px] text-green-500 mt-1.5">Copied!</p>}
        </CardBody>
      </Card>
    </div>
  )
}
