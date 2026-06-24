'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WeightLog } from '@/lib/types'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function WeightPage() {
  const router = useRouter()
  const today  = format(new Date(), 'yyyy-MM-dd')
  const [pregnancyId, setPregnancyId] = useState<string | null>(null)
  const [logs,    setLogs]    = useState<WeightLog[]>([])
  const [weight,  setWeight]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: pregnancy } = await supabase
      .from('pregnancies').select('id')
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
      .limit(1).single()

    if (!pregnancy) { router.push('/onboarding'); return }
    setPregnancyId(pregnancy.id)

    const { data } = await supabase
      .from('weight_logs').select('*')
      .eq('pregnancy_id', pregnancy.id)
      .order('date')

    if (data) {
      setLogs(data)
      const todayLog = data.find((l: WeightLog) => l.date === today)
      if (todayLog) setWeight(String(todayLog.weight_kg))
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!pregnancyId || !weight) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('weight_logs')
      .upsert({
        pregnancy_id: pregnancyId,
        date:         today,
        weight_kg:    parseFloat(weight),
        logged_by:    user.id,
      }, { onConflict: 'pregnancy_id,date' })
      .select().single()

    if (data) {
      setLogs((prev) => {
        const without = prev.filter((l) => l.date !== today)
        return [...without, data].sort((a, b) => a.date.localeCompare(b.date))
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">⚖️</div>
      </div>
    )
  }

  const chartData = logs.map((l) => ({
    date:   format(parseISO(l.date), 'MMM d'),
    weight: l.weight_kg,
  }))

  const latest = logs[logs.length - 1]
  const first  = logs[0]
  const gained = latest && first ? (latest.weight_kg - first.weight_kg).toFixed(1) : null

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-2xl font-bold text-gray-900">Weight Tracker</h1>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardBody className="py-3 text-center">
            <p className="text-lg font-bold text-gray-900">{latest?.weight_kg}</p>
            <p className="text-xs text-gray-500">kg today</p>
          </CardBody></Card>
          <Card><CardBody className="py-3 text-center">
            <p className="text-lg font-bold text-gray-900">{first?.weight_kg}</p>
            <p className="text-xs text-gray-500">kg start</p>
          </CardBody></Card>
          <Card><CardBody className="py-3 text-center">
            <p className={`text-lg font-bold ${Number(gained) > 0 ? 'text-rose-600' : 'text-green-700'}`}>
              {gained ? `+${gained}` : '—'}
            </p>
            <p className="text-xs text-gray-500">kg gained</p>
          </CardBody></Card>
        </div>
      )}

      {/* Log today */}
      <Card>
        <CardHeader><p className="text-sm font-semibold text-gray-700">Log Today&apos;s Weight</p></CardHeader>
        <CardBody>
          <form onSubmit={handleSave} className="flex gap-3 items-end">
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full text-3xl font-bold text-gray-900 focus:outline-none bg-transparent"
                />
                <span className="text-gray-400 text-sm">kg</span>
              </div>
              <div className="h-0.5 bg-gray-200 rounded mt-1" />
            </div>
            <Button type="submit" disabled={saving || !weight}>
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader><p className="text-sm font-semibold text-gray-700">Weight Over Pregnancy</p></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [`${v} kg`, 'Weight']}
                />
                <Line
                  type="monotone" dataKey="weight"
                  stroke="#f43f5e" strokeWidth={2.5}
                  dot={{ fill: '#f43f5e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {logs.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">⚖️</div>
          <p className="text-sm">No weight logs yet</p>
          <p className="text-xs mt-1">Log your first reading above</p>
        </div>
      )}
    </div>
  )
}
