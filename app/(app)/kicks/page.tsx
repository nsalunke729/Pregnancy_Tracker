'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KickSession } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default function KicksPage() {
  const router = useRouter()
  const [pregnancyId, setPregnancyId] = useState<string | null>(null)
  const [kicks,     setKicks]     = useState(0)
  const [running,   setRunning]   = useState(false)
  const [elapsed,   setElapsed]   = useState(0)
  const [sessions,  setSessions]  = useState<KickSession[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const startRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    load()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      .from('kick_sessions').select('*')
      .eq('pregnancy_id', pregnancy.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setSessions(data ?? [])
    setLoading(false)
  }

  function startTimer() {
    startRef.current = Date.now() - elapsed * 1000
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
    }, 1000)
    setRunning(true)
  }

  function handleKick() {
    if (!running) startTimer()
    setKicks((k) => k + 1)
  }

  async function saveSession() {
    if (!pregnancyId || kicks === 0) return
    setSaving(true)
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)

    const supabase = createClient()
    const { data } = await supabase.from('kick_sessions').insert({
      pregnancy_id:     pregnancyId,
      kick_count:       kicks,
      duration_minutes: Math.round(elapsed / 60) || 1,
    }).select().single()

    if (data) setSessions((prev) => [data, ...prev])
    setKicks(0)
    setElapsed(0)
    startRef.current = null
    setSaving(false)
  }

  function resetSession() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setKicks(0)
    setElapsed(0)
    startRef.current = null
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">👶</div>
      </div>
    )
  }

  const goalReached = kicks >= 10

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-2xl font-bold text-gray-900">Kick Counter</h1>
      </div>

      {goalReached && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-green-700 font-semibold">🎉 10 kicks reached in {formatTime(elapsed)}!</p>
          <p className="text-green-600 text-xs mt-0.5">Baby is active and healthy</p>
        </div>
      )}

      {/* Big tap button */}
      <div className="flex flex-col items-center py-6 space-y-6">
        <button
          onClick={handleKick}
          className={`w-48 h-48 rounded-full text-white shadow-xl flex flex-col items-center justify-center transition-all active:scale-90 select-none ${
            goalReached
              ? 'bg-gradient-to-br from-green-400 to-green-600'
              : 'bg-gradient-to-br from-rose-400 to-rose-600'
          }`}
        >
          <span className="text-6xl font-bold leading-none">{kicks}</span>
          <span className="text-rose-100 text-sm mt-1">
            {kicks === 0 ? 'Tap to count' : kicks === 1 ? 'kick' : 'kicks'}
          </span>
        </button>

        <div className="text-3xl font-mono font-bold text-gray-700">{formatTime(elapsed)}</div>

        {kicks > 0 && (
          <div className="flex gap-3">
            <Button size="lg" onClick={saveSession} disabled={saving}>
              {saving ? 'Saving…' : 'Save Session'}
            </Button>
            <Button size="lg" variant="ghost" onClick={resetSession}>
              Reset
            </Button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-400 -mt-2">
        Goal: 10 kicks in 2 hours
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3">RECENT SESSIONS</p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card key={s.id}>
                <CardBody className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{s.kick_count} kicks</p>
                    <p className="text-xs text-gray-400">{format(new Date(s.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{s.duration_minutes} min</p>
                    {s.kick_count >= 10 && <p className="text-xs text-green-500">✓ Goal met</p>}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
