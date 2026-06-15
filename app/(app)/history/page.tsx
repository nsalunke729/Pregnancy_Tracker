'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardBody } from '@/components/ui/card'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, parseISO, getDay,
  startOfWeek, endOfWeek, addWeeks,
} from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────── */
interface DayMeta  { hasLog: boolean; hasKicks: boolean; mood?: number }
interface Symptom  { symptom_type: string; severity: number }
interface MedEntry { name: string; dosage?: string; taken: boolean }
interface KickEntry { kick_count: number; duration_minutes?: number; created_at: string }
interface DayDetail {
  mood?: number; water_glasses?: number; sleep_hours?: number; notes?: string
  symptoms: Symptom[]; medicines: MedEntry[]; kicks: KickEntry[]; weight_kg?: number
}

const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' }
const MOOD_LABEL: Record<number, string> = { 1: 'Awful', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' }
const MOOD_BG:    Record<number, string> = {
  1: 'bg-red-100 text-red-700', 2: 'bg-orange-100 text-orange-700',
  3: 'bg-amber-100 text-amber-700', 4: 'bg-lime-100 text-lime-700', 5: 'bg-green-100 text-green-700',
}
type ViewMode = 'week' | 'month'

/* ── Page ───────────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter()

  const [pregnancyId,   setPregnancyId]   = useState<string | null>(null)
  const [viewMode,      setViewMode]      = useState<ViewMode>('week')
  const [weekOffset,    setWeekOffset]    = useState(0)
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [dayMeta,       setDayMeta]       = useState<Record<string, DayMeta>>({})
  const [selectedDay,   setSelectedDay]   = useState<string | null>(null)
  const [dayDetail,     setDayDetail]     = useState<DayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pageLoading,   setPageLoading]   = useState(true)

  const weekAnchor = addWeeks(new Date(), weekOffset)
  const weekStart  = startOfWeek(weekAnchor, { weekStartsOn: 1 })
  const weekEnd    = endOfWeek(weekAnchor,   { weekStartsOn: 1 })
  const weekDays   = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => { init() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pregnancyId) return
    const s = viewMode === 'week' ? weekStart : startOfMonth(currentMonth)
    const e = viewMode === 'week' ? weekEnd   : endOfMonth(currentMonth)
    loadRange(s, e)
  }, [pregnancyId, viewMode, weekOffset, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function loadRange(start: Date, end: Date) {
    if (!pregnancyId) return
    const supabase = createClient()
    const s = format(start, 'yyyy-MM-dd'), e = format(end, 'yyyy-MM-dd')
    const [{ data: logs }, { data: kicks }] = await Promise.all([
      supabase.from('daily_logs').select('date, mood').eq('pregnancy_id', pregnancyId).gte('date', s).lte('date', e),
      supabase.from('kick_sessions').select('date').eq('pregnancy_id', pregnancyId).gte('date', s).lte('date', e),
    ])
    const map: Record<string, DayMeta> = {}
    logs?.forEach((l: { date: string; mood?: number }) => { map[l.date] = { hasLog: true, hasKicks: false, mood: l.mood } })
    kicks?.forEach((k: { date: string }) => {
      if (map[k.date]) map[k.date].hasKicks = true
      else map[k.date] = { hasLog: false, hasKicks: true }
    })
    setDayMeta(map)
  }

  async function loadDayDetail(dateStr: string) {
    if (!pregnancyId) return
    setDetailLoading(true); setDayDetail(null)
    const supabase = createClient()
    const [{ data: log }, { data: meds }, { data: kicks }, { data: weight }] = await Promise.all([
      supabase.from('daily_logs').select('*, symptoms(*)').eq('pregnancy_id', pregnancyId).eq('date', dateStr).single(),
      supabase.from('medicines').select('id, name, dosage').eq('pregnancy_id', pregnancyId),
      supabase.from('kick_sessions').select('kick_count, duration_minutes, created_at').eq('pregnancy_id', pregnancyId).eq('date', dateStr),
      supabase.from('weight_logs').select('weight_kg').eq('pregnancy_id', pregnancyId).eq('date', dateStr).single(),
    ])
    let medicineEntries: MedEntry[] = []
    if (meds?.length) {
      const { data: medLogs } = await supabase
        .from('medicine_logs').select('medicine_id, taken')
        .in('medicine_id', meds.map((m: { id: string }) => m.id))
        .eq('date', dateStr)
      const logMap: Record<string, boolean> = {}
      medLogs?.forEach((l: { medicine_id: string; taken: boolean }) => { logMap[l.medicine_id] = l.taken })
      medicineEntries = meds.map((m: { id: string; name: string; dosage?: string }) => ({
        name: m.name, dosage: m.dosage, taken: logMap[m.id] ?? false,
      }))
    }
    setDayDetail({
      mood: log?.mood, water_glasses: log?.water_glasses,
      sleep_hours: log?.sleep_hours, notes: log?.notes,
      symptoms: log?.symptoms ?? [], medicines: medicineEntries,
      kicks: kicks ?? [], weight_kg: weight?.weight_kg,
    })
    setDetailLoading(false)
  }

  function selectDay(dateStr: string) {
    if (selectedDay === dateStr) { setSelectedDay(null); setDayDetail(null); return }
    setSelectedDay(dateStr)
    loadDayDetail(dateStr)
  }

  function switchMode(mode: ViewMode) {
    setViewMode(mode); setSelectedDay(null); setDayDetail(null)
  }

  if (pageLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-4xl animate-pulse">📆</div>
    </div>
  )

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDay  = getDay(startOfMonth(currentMonth))

  return (
    <div className="p-4 space-y-4">
      {/* Title + mode toggle */}
      <div className="pt-4 pb-1 flex items-end justify-between">
        <div>
          <p className="text-rose-400 text-sm font-medium">Your journey</p>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => switchMode('week')}
            className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
              viewMode === 'week' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500')}
          >
            Week
          </button>
          <button
            onClick={() => switchMode('month')}
            className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
              viewMode === 'month' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500')}
          >
            All
          </button>
        </div>
      </div>

      {/* ── Week View ── */}
      {viewMode === 'week' && (
        <Card>
          <CardBody className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { setSelectedDay(null); setDayDetail(null); setWeekOffset(o => o - 1) }}
                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">
                  {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
                </p>
                {weekOffset === 0
                  ? <p className="text-[10px] text-rose-400 font-medium">Current week</p>
                  : <button onClick={() => { setSelectedDay(null); setDayDetail(null); setWeekOffset(0) }}
                      className="text-[10px] text-rose-400 font-medium hover:underline">
                      Back to today
                    </button>
                }
              </div>
              <button
                onClick={() => { setSelectedDay(null); setDayDetail(null); setWeekOffset(o => o + 1) }}
                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const dateStr    = format(day, 'yyyy-MM-dd')
                const meta       = dayMeta[dateStr]
                const todayDay   = isToday(day)
                const isSelected = selectedDay === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => selectDay(dateStr)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 rounded-2xl transition-all select-none',
                      isSelected ? 'bg-rose-500 text-white scale-105 shadow-md' :
                      todayDay   ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-300' :
                                   'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <span className={cn('text-[10px] font-semibold', isSelected ? 'text-rose-100' : 'text-gray-400')}>
                      {format(day, 'EEE').slice(0, 2).toUpperCase()}
                    </span>
                    <span className={cn('text-sm font-bold leading-none', todayDay && !isSelected && 'font-extrabold')}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex gap-0.5 h-2 items-center">
                      {meta?.hasLog   && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white/70' : 'bg-blue-400')} />}
                      {meta?.hasKicks && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white/70' : 'bg-purple-400')} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Daily log</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Kicks</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Month View ── */}
      {viewMode === 'month' && (
        <Card>
          <CardBody className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { setSelectedDay(null); setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1)) }}
                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-gray-900 text-base">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => { setSelectedDay(null); setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1)) }}
                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {monthDays.map((day) => {
                const dateStr    = format(day, 'yyyy-MM-dd')
                const meta       = dayMeta[dateStr]
                const todayDay   = isToday(day)
                const isSelected = selectedDay === dateStr
                const outMonth   = !isSameMonth(day, currentMonth)
                return (
                  <button
                    key={dateStr}
                    onClick={() => !outMonth && selectDay(dateStr)}
                    disabled={outMonth}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center transition-all select-none',
                      outMonth    ? 'opacity-20 cursor-default' :
                      isSelected  ? 'bg-rose-500 text-white shadow-md scale-105' :
                      todayDay    ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-300' :
                                    'hover:bg-rose-50 text-gray-700'
                    )}
                  >
                    <span className={cn('text-xs leading-none', todayDay && !isSelected && 'font-bold')}>
                      {format(day, 'd')}
                    </span>
                    {meta && (
                      <div className="flex gap-0.5 mt-1">
                        {meta.hasLog   && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white/70' : 'bg-blue-400')} />}
                        {meta.hasKicks && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white/70' : 'bg-purple-400')} />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Daily log</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Kicks</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Day Detail Panel ── */}
      {selectedDay && (
        <Card className="border-rose-100">
          <CardBody className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-rose-400 font-medium">{format(parseISO(selectedDay), 'EEEE')}</p>
                <p className="text-base font-bold text-gray-900">{format(parseISO(selectedDay), 'MMMM d, yyyy')}</p>
              </div>
              <button
                onClick={() => { setSelectedDay(null); setDayDetail(null) }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-20 bg-gray-100 rounded-xl" />
                <div className="h-16 bg-gray-100 rounded-xl" />
              </div>
            )}

            {!detailLoading && dayDetail && !dayDetail.mood && !dayDetail.water_glasses && !dayDetail.symptoms.length && !dayDetail.kicks.length && !dayDetail.weight_kg && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">Nothing logged on this day</p>
              </div>
            )}

            {!detailLoading && dayDetail && (
              <div className="space-y-3">

                {/* ── Compact stats pill row ── */}
                {(dayDetail.mood || dayDetail.water_glasses || dayDetail.sleep_hours || dayDetail.weight_kg) && (
                  <div className="flex flex-wrap gap-2">
                    {dayDetail.mood && (
                      <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', MOOD_BG[dayDetail.mood])}>
                        {MOOD_EMOJI[dayDetail.mood]} {MOOD_LABEL[dayDetail.mood]}
                      </span>
                    )}
                    {!!dayDetail.water_glasses && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                        💧 {dayDetail.water_glasses} glasses
                      </span>
                    )}
                    {!!dayDetail.sleep_hours && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
                        😴 {dayDetail.sleep_hours}h sleep
                      </span>
                    )}
                    {dayDetail.weight_kg && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                        ⚖️ {dayDetail.weight_kg} kg
                      </span>
                    )}
                  </div>
                )}

                {/* ── Symptoms ── */}
                {dayDetail.symptoms.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">🤒 SYMPTOMS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dayDetail.symptoms.map((s) => (
                        <span key={s.symptom_type} className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-semibold',
                          s.severity >= 7 ? 'bg-red-100 text-red-700' :
                          s.severity >= 4 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        )}>
                          {s.symptom_type} · {s.severity}/10
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Medicines ── */}
                {dayDetail.medicines.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">💊 MEDICINES</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {dayDetail.medicines.map((m) => (
                        <div key={m.name} className={cn(
                          'flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium',
                          m.taken ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
                        )}>
                          <span className="flex-shrink-0">{m.taken ? '✅' : '⬜'}</span>
                          <span className={cn('truncate', !m.taken && 'line-through')}>{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Kicks ── */}
                {dayDetail.kicks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide mb-2">👶 KICKS</p>
                    <div className="space-y-1.5">
                      {dayDetail.kicks.map((k, i) => (
                        <div key={i} className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2">
                          <span className="text-sm font-bold text-purple-700">{k.kick_count} kicks</span>
                          <span className="text-xs text-purple-400">
                            {format(parseISO(k.created_at), 'h:mm a')}
                            {k.duration_minutes ? ` · ${k.duration_minutes}min` : ''}
                            {k.kick_count >= 10 ? ' · ✓' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Notes ── */}
                {dayDetail.notes && (
                  <div className="bg-amber-50 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] text-amber-500 font-semibold mb-1">📝 NOTES</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{dayDetail.notes}</p>
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
