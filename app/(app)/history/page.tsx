'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardBody } from '@/components/ui/card'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, parseISO, getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────── */
interface DayMeta { hasLog: boolean; hasKicks: boolean; mood?: number }

interface Symptom  { symptom_type: string; severity: number }
interface MedEntry { name: string; dosage?: string; taken: boolean }
interface KickEntry { kick_count: number; duration_minutes?: number; created_at: string }

interface DayDetail {
  mood?: number
  water_glasses?: number
  sleep_hours?: number
  notes?: string
  symptoms: Symptom[]
  medicines: MedEntry[]
  kicks: KickEntry[]
  weight_kg?: number
}

const MOOD_EMOJI:  Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' }
const MOOD_LABEL:  Record<number, string> = { 1: 'Awful', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' }
const MOOD_BG:     Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-lime-100 text-lime-700',
  5: 'bg-green-100 text-green-700',
}

/* ── Page ───────────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter()

  const [pregnancyId,   setPregnancyId]   = useState<string | null>(null)
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [dayMeta,       setDayMeta]       = useState<Record<string, DayMeta>>({})
  const [selectedDay,   setSelectedDay]   = useState<string | null>(null)
  const [dayDetail,     setDayDetail]     = useState<DayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pageLoading,   setPageLoading]   = useState(true)

  useEffect(() => { init() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (pregnancyId) loadMonth() }, [pregnancyId, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase
      .from('pregnancies').select('id')
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
      .limit(1).single()

    if (!p) { router.push('/onboarding'); return }
    setPregnancyId(p.id)
    setPageLoading(false)
  }

  async function loadMonth() {
    if (!pregnancyId) return
    const supabase = createClient()
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end   = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    const [{ data: logs }, { data: kicks }] = await Promise.all([
      supabase.from('daily_logs').select('date, mood')
        .eq('pregnancy_id', pregnancyId).gte('date', start).lte('date', end),
      supabase.from('kick_sessions').select('date')
        .eq('pregnancy_id', pregnancyId).gte('date', start).lte('date', end),
    ])

    const map: Record<string, DayMeta> = {}
    logs?.forEach((l: { date: string; mood?: number }) => {
      map[l.date] = { hasLog: true, hasKicks: false, mood: l.mood }
    })
    kicks?.forEach((k: { date: string }) => {
      if (map[k.date]) map[k.date].hasKicks = true
      else map[k.date] = { hasLog: false, hasKicks: true }
    })
    setDayMeta(map)
  }

  async function loadDayDetail(dateStr: string) {
    if (!pregnancyId) return
    setDetailLoading(true)
    setDayDetail(null)

    const supabase = createClient()

    const [
      { data: log },
      { data: meds },
      { data: kicks },
      { data: weight },
    ] = await Promise.all([
      supabase.from('daily_logs').select('*, symptoms(*)').eq('pregnancy_id', pregnancyId).eq('date', dateStr).single(),
      supabase.from('medicines').select('id, name, dosage').eq('pregnancy_id', pregnancyId),
      supabase.from('kick_sessions').select('kick_count, duration_minutes, created_at').eq('pregnancy_id', pregnancyId).eq('date', dateStr),
      supabase.from('weight_logs').select('weight_kg').eq('pregnancy_id', pregnancyId).eq('date', dateStr).single(),
    ])

    // Medicine taken-status for this day
    let medicineEntries: MedEntry[] = []
    if (meds?.length) {
      const { data: medLogs } = await supabase
        .from('medicine_logs').select('medicine_id, taken')
        .in('medicine_id', meds.map((m: { id: string }) => m.id))
        .eq('date', dateStr)

      const logMap: Record<string, boolean> = {}
      medLogs?.forEach((l: { medicine_id: string; taken: boolean }) => { logMap[l.medicine_id] = l.taken })

      medicineEntries = meds.map((m: { id: string; name: string; dosage?: string }) => ({
        name:   m.name,
        dosage: m.dosage,
        taken:  logMap[m.id] ?? false,
      }))
    }

    setDayDetail({
      mood:          log?.mood,
      water_glasses: log?.water_glasses,
      sleep_hours:   log?.sleep_hours,
      notes:         log?.notes,
      symptoms:      log?.symptoms ?? [],
      medicines:     medicineEntries,
      kicks:         kicks ?? [],
      weight_kg:     weight?.weight_kg,
    })
    setDetailLoading(false)
  }

  function selectDay(dateStr: string) {
    if (selectedDay === dateStr) { setSelectedDay(null); setDayDetail(null); return }
    setSelectedDay(dateStr)
    loadDayDetail(dateStr)
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">📆</div>
      </div>
    )
  }

  const days     = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDay = getDay(startOfMonth(currentMonth))

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-rose-400 text-sm font-medium">Your journey</p>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
      </div>

      {/* ── Calendar ── */}
      <Card>
        <CardBody className="pt-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setSelectedDay(null); setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1)) }}
              className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-gray-900 text-base">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => { setSelectedDay(null); setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1)) }}
              className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {days.map((day) => {
              const dateStr  = format(day, 'yyyy-MM-dd')
              const meta     = dayMeta[dateStr]
              const todayDay = isToday(day)
              const isSelected = selectedDay === dateStr
              const outOfMonth = !isSameMonth(day, currentMonth)

              return (
                <button
                  key={dateStr}
                  onClick={() => !outOfMonth && selectDay(dateStr)}
                  disabled={outOfMonth}
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center transition-all select-none',
                    outOfMonth  ? 'opacity-20 cursor-default' :
                    isSelected  ? 'bg-rose-500 text-white shadow-md scale-105' :
                    todayDay    ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-300' :
                                  'hover:bg-rose-50 text-gray-700'
                  )}
                >
                  <span className={cn('text-xs leading-none', todayDay && !isSelected && 'font-bold')}>
                    {format(day, 'd')}
                  </span>
                  {meta && !isSelected && (
                    <div className="flex gap-0.5 mt-1">
                      {meta.hasLog   && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      {meta.hasKicks && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    </div>
                  )}
                  {meta && isSelected && (
                    <div className="flex gap-0.5 mt-1">
                      {meta.hasLog   && <span className="w-1.5 h-1.5 rounded-full bg-white/70" />}
                      {meta.hasKicks && <span className="w-1.5 h-1.5 rounded-full bg-white/70" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Daily log</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Kicks</span>
            <span className="flex items-center gap-1.5 ml-auto">Tap a day to view details</span>
          </div>
        </CardBody>
      </Card>

      {/* ── Day Detail ── */}
      {selectedDay && (
        <Card className="border-rose-100">
          <CardBody className="pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-rose-400 font-medium">
                  {format(parseISO(selectedDay), 'EEEE')}
                </p>
                <p className="text-base font-bold text-gray-900">
                  {format(parseISO(selectedDay), 'MMMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => { setSelectedDay(null); setDayDetail(null) }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading */}
            {detailLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-20 bg-gray-100 rounded-xl" />
                <div className="h-16 bg-gray-100 rounded-xl" />
              </div>
            )}

            {/* No data */}
            {!detailLoading && dayDetail && !dayDetail.mood && !dayDetail.water_glasses && !dayDetail.symptoms.length && !dayDetail.kicks.length && !dayDetail.weight_kg && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">Nothing logged on this day</p>
              </div>
            )}

            {/* Full detail */}
            {!detailLoading && dayDetail && (
              <div className="space-y-4">

                {/* Mood */}
                {dayDetail.mood && (
                  <div className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl', MOOD_BG[dayDetail.mood])}>
                    <span className="text-3xl">{MOOD_EMOJI[dayDetail.mood]}</span>
                    <div>
                      <p className="text-xs font-semibold opacity-60">Mood</p>
                      <p className="text-base font-bold">{MOOD_LABEL[dayDetail.mood]}</p>
                    </div>
                  </div>
                )}

                {/* Water + Sleep row */}
                {(!!dayDetail.water_glasses || !!dayDetail.sleep_hours) && (
                  <div className="grid grid-cols-2 gap-3">
                    {!!dayDetail.water_glasses && (
                      <div className="bg-blue-50 rounded-2xl px-4 py-3">
                        <p className="text-[11px] text-blue-400 font-semibold">💧 WATER</p>
                        <p className="text-2xl font-bold text-blue-600">{dayDetail.water_glasses}</p>
                        <p className="text-xs text-blue-400">glasses</p>
                      </div>
                    )}
                    {!!dayDetail.sleep_hours && (
                      <div className="bg-indigo-50 rounded-2xl px-4 py-3">
                        <p className="text-[11px] text-indigo-400 font-semibold">😴 SLEEP</p>
                        <p className="text-2xl font-bold text-indigo-600">{dayDetail.sleep_hours}</p>
                        <p className="text-xs text-indigo-400">hours</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Weight */}
                {dayDetail.weight_kg && (
                  <div className="bg-emerald-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">⚖️</span>
                    <div>
                      <p className="text-[11px] text-emerald-500 font-semibold">WEIGHT</p>
                      <p className="text-base font-bold text-emerald-700">{dayDetail.weight_kg} kg</p>
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {dayDetail.symptoms.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">
                      🤒 SYMPTOMS ({dayDetail.symptoms.length})
                    </p>
                    <div className="space-y-2">
                      {dayDetail.symptoms.map((s) => {
                        const pct = (s.severity / 10) * 100
                        const color = s.severity >= 7 ? 'bg-red-400' : s.severity >= 4 ? 'bg-orange-400' : 'bg-yellow-400'
                        return (
                          <div key={s.symptom_type} className="bg-gray-50 rounded-xl px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-800">{s.symptom_type}</span>
                              <span className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-full',
                                s.severity >= 7 ? 'bg-red-100 text-red-600'
                                : s.severity >= 4 ? 'bg-orange-100 text-orange-600'
                                : 'bg-green-100 text-green-600'
                              )}>
                                {s.severity}/10
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Medicines */}
                {dayDetail.medicines.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">
                      💊 MEDICINES
                    </p>
                    <div className="space-y-1.5">
                      {dayDetail.medicines.map((m) => (
                        <div
                          key={m.name}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                            m.taken ? 'bg-green-50' : 'bg-gray-50'
                          )}
                        >
                          <span className="text-base flex-shrink-0">{m.taken ? '✅' : '⬜'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-medium',
                              m.taken ? 'text-green-800' : 'text-gray-400 line-through'
                            )}>
                              {m.name}
                            </p>
                            {m.dosage && <p className="text-xs text-gray-400">{m.dosage}</p>}
                          </div>
                          {m.taken && <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Taken</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kicks */}
                {dayDetail.kicks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">
                      👶 KICK SESSIONS
                    </p>
                    <div className="space-y-2">
                      {dayDetail.kicks.map((k, i) => (
                        <div key={i} className="bg-purple-50 rounded-xl px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-base font-bold text-purple-700">{k.kick_count} kicks</p>
                            <p className="text-xs text-purple-400">
                              {format(parseISO(k.created_at), 'h:mm a')}
                            </p>
                          </div>
                          <div className="text-right">
                            {k.duration_minutes && (
                              <p className="text-sm font-semibold text-purple-600">{k.duration_minutes} min</p>
                            )}
                            {k.kick_count >= 10 && (
                              <p className="text-xs text-green-500 font-medium">✓ Goal met</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {dayDetail.notes && (
                  <div className="bg-amber-50 rounded-2xl px-4 py-3">
                    <p className="text-[11px] text-amber-500 font-semibold mb-1">📝 NOTES</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{dayDetail.notes}</p>
                  </div>
                )}

              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
