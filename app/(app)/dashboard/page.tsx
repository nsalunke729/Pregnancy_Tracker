'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateWeek, daysUntilDue, formatDueDate, getFruitSize } from '@/lib/pregnancy'
import { Pregnancy } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, Pill, Baby, Scale, Calendar, Copy } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null)
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('pregnancies')
        .select('*')
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) { router.push('/onboarding') }
      else { setPregnancy(data) }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">🤰</div>
      </div>
    )
  }

  if (!pregnancy) return null

  const week  = calculateWeek(pregnancy.lmp_date)
  const days  = daysUntilDue(pregnancy.due_date)
  const fruit = getFruitSize(week)

  async function copyCode() {
    await navigator.clipboard.writeText(pregnancy!.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const QUICK_ACTIONS = [
    { href: '/log',          icon: ClipboardList, label: 'Daily Log',    color: 'bg-rose-50 text-rose-500' },
    { href: '/medicines',    icon: Pill,          label: 'Medicines',    color: 'bg-purple-50 text-purple-500' },
    { href: '/kicks',        icon: Baby,          label: 'Kick Counter', color: 'bg-blue-50 text-blue-500' },
    { href: '/weight',       icon: Scale,         label: 'Weight',       color: 'bg-green-50 text-green-500' },
    { href: '/appointments', icon: Calendar,      label: 'Appointments', color: 'bg-orange-50 text-orange-500' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-4 pb-2">
        <p className="text-gray-500 text-sm">Your pregnancy journey</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {pregnancy.baby_name ? `Hello, ${pregnancy.baby_name}! 👋` : 'Good day! 🌸'}
        </h1>
      </div>

      {/* Week Hero Card */}
      <Card className="bg-gradient-to-br from-rose-400 to-rose-600 text-white border-0">
        <CardBody className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Week</p>
              <p className="text-6xl font-bold leading-none">{week}</p>
              <p className="text-rose-100 text-sm mt-1">of 40</p>
            </div>
            <div className="text-center">
              <div className="text-6xl">{fruit.emoji}</div>
              <p className="text-rose-100 text-xs mt-1">Size of a</p>
              <p className="text-white text-sm font-semibold">{fruit.fruit}</p>
              <p className="text-rose-200 text-xs">{fruit.size}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Due Date Countdown */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="py-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{days}</p>
            <p className="text-gray-500 text-xs mt-1">days until due date</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4 text-center">
            <p className="text-sm font-semibold text-gray-900">{formatDueDate(pregnancy.due_date)}</p>
            <p className="text-gray-500 text-xs mt-1">estimated due date</p>
          </CardBody>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardBody>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round((week / 40) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-rose-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (week / 40) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>Week 1</span>
            <span>Trimester {week <= 12 ? '1' : week <= 26 ? '2' : '3'}</span>
            <span>Week 40</span>
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm active:scale-95 transition-transform">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-gray-700">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Partner Sharing */}
      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-gray-700 mb-1">Partner Code</p>
          <p className="text-xs text-gray-500 mb-3">Share this with your partner so they can join</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-widest text-rose-500 flex-1">
              {pregnancy.join_code}
            </span>
            <Button size="icon" variant="secondary" onClick={copyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {copied && <p className="text-xs text-green-500 mt-1">Copied to clipboard!</p>}
        </CardBody>
      </Card>
    </div>
  )
}
