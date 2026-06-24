'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Contraction } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { vibrate } from '@/lib/haptics'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function ContractionsPage() {
  const router = useRouter()
  const [pregnancyId,   setPregnancyId]   = useState<string | null>(null)
  const [contractions,  setContractions]  = useState<Contraction[]>([])
  const [running,       setRunning]       = useState(false)
  const [elapsed,       setElapsed]       = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
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
      .from('contractions').select('*')
      .eq('pregnancy_id', pregnancy.id)
      .order('started_at', { ascending: false })
      .limit(30)

    setContractions(data ?? [])
    setLoading(false)
  }

  function handleStart() {
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
    }, 1000)
    setRunning(true)
    vibrate(40)
  }

  async function handleStop() {
    if (!pregnancyId || !startRef.current) return
    if (timerRef.current) clearInterval(timerRef.current)
    vibrate(40)

    const startedAt = new Date(startRef.current).toISOString()
    const duration = Math.round((Date.now() - startRef.current) / 1000)
    setRunning(false)
    setElapsed(0)
    startRef.current = null
    setSaving(true)

    const supabase = createClient()
    const { data } = await supabase.from('contractions').insert({
      pregnancy_id:     pregnancyId,
      started_at:       startedAt,
      duration_seconds: duration || 1,
    }).select().single()

    if (data) setContractions((prev) => [data, ...prev])
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">🤰</div>
      </div>
    )
  }

  // ── 5-1-1 pattern check: contractions ~5 min apart, ~1 min long, for ~1 hour ──
  // Look at every contraction within a trailing window (not a fixed count) so
  // a real hour of ~5-min-apart contractions (~13 entries) isn't sliced away.
  const WINDOW_MS = 75 * 60 * 1000
  const anchor = contractions[0] ? new Date(contractions[0].started_at).getTime() : 0
  const windowed = contractions.filter(
    (c) => anchor - new Date(c.started_at).getTime() <= WINDOW_MS
  )
  let patternAlert = false
  if (windowed.length >= 3) {
    const gaps: number[] = []
    for (let i = 0; i < windowed.length - 1; i++) {
      const gap = (new Date(windowed[i].started_at).getTime() - new Date(windowed[i + 1].started_at).getTime()) / 1000
      gaps.push(gap)
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const avgDuration = windowed.reduce((a, c) => a + c.duration_seconds, 0) / windowed.length
    const span = (new Date(windowed[0].started_at).getTime() - new Date(windowed[windowed.length - 1].started_at).getTime()) / 1000
    patternAlert = avgGap <= 5 * 60 && avgDuration >= 60 && span >= 60 * 60
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-2xl font-bold text-gray-900">Contraction Timer</h1>
      </div>

      {patternAlert && (
        <div className="bg-red-50 border border-red-300 rounded-2xl px-4 py-3 text-center">
          <p className="text-red-700 font-semibold">🚨 5-1-1 pattern detected</p>
          <p className="text-red-600 text-xs mt-0.5">
            Contractions ~5 min apart, lasting ~1 min, for over an hour. Contact your doctor or head to the hospital.
          </p>
        </div>
      )}

      {/* Big start/stop button */}
      <div className="flex flex-col items-center py-6 space-y-6">
        <button
          onClick={running ? handleStop : handleStart}
          disabled={saving}
          className={`w-48 h-48 rounded-full text-white shadow-xl flex flex-col items-center justify-center transition-all active:scale-90 select-none ${
            running
              ? 'bg-gradient-to-br from-red-400 to-red-600'
              : 'bg-gradient-to-br from-rose-400 to-rose-600'
          }`}
        >
          <span className="text-4xl font-mono font-bold leading-none">{formatTime(elapsed)}</span>
          <span className="text-rose-100 text-sm mt-2">
            {running ? 'Tap to stop' : 'Tap to start'}
          </span>
        </button>
      </div>

      <div className="text-center text-xs text-gray-400 -mt-2">
        5-1-1 rule: contractions 5 min apart, lasting 1 min, for 1 hour — see{' '}
        <span className="text-rose-400 font-medium">Symptom Guide</span> for details
      </div>

      {/* Contraction history */}
      {contractions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3">RECENT CONTRACTIONS</p>
          <div className="space-y-2">
            {contractions.map((c, i) => {
              const prev = contractions[i + 1]
              const gapSeconds = prev
                ? Math.round((new Date(c.started_at).getTime() - new Date(prev.started_at).getTime()) / 1000)
                : null
              return (
                <Card key={c.id}>
                  <CardBody className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold text-gray-900">{formatTime(c.duration_seconds)} duration</p>
                      <p className="text-xs text-gray-400">{format(new Date(c.started_at), 'h:mm a')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {gapSeconds !== null ? `${formatTime(gapSeconds)} apart` : '—'}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {contractions.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🤰</div>
          <p className="text-sm">No contractions logged yet</p>
          <p className="text-xs mt-1">Tap the button above when one starts</p>
        </div>
      )}
    </div>
  )
}
