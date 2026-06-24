'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SYMPTOMS } from '@/lib/pregnancy'
import { Medicine, MedicineLog } from '@/lib/types'
import { ChipGrid } from '@/components/ChipGrid'
import { EmojiMoodPicker } from '@/components/EmojiMoodPicker'
import { WaterGlasses } from '@/components/WaterGlasses'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { format } from 'date-fns'
import { CheckCircle, Check, Pill, Heart, Activity, Droplets, Moon, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SymptomEntry { type: string; severity: number }

export default function LogPage() {
  const router = useRouter()
  const today  = format(new Date(), 'yyyy-MM-dd')

  const [pregnancyId, setPregnancyId] = useState<string | null>(null)
  const [symptoms,   setSymptoms]     = useState<string[]>([])
  const [severities, setSeverities]   = useState<Record<string, number>>({})
  const [mood,       setMood]         = useState<number>(0)
  const [water,      setWater]        = useState(0)
  const [sleep,      setSleep]        = useState(7)
  const [notes,      setNotes]        = useState('')
  const [medicines,  setMedicines]    = useState<Medicine[]>([])
  const [medLogs,    setMedLogs]      = useState<Record<string, boolean>>({})
  const [saving,     setSaving]       = useState(false)
  const [saved,      setSaved]        = useState(false)
  const [loading,    setLoading]      = useState(true)

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

    // Load today's log
    const { data: log } = await supabase
      .from('daily_logs')
      .select('*, symptoms(*)')
      .eq('pregnancy_id', pregnancy.id)
      .eq('date', today)
      .single()

    if (log) {
      setMood(log.mood ?? 0)
      setWater(log.water_glasses ?? 0)
      setSleep(log.sleep_hours ?? 7)
      setNotes(log.notes ?? '')
      if (log.symptoms?.length) {
        setSymptoms(log.symptoms.map((s: SymptomEntry) => s.type))
        const sev: Record<string, number> = {}
        log.symptoms.forEach((s: { type: string; severity: number }) => { sev[s.type] = s.severity })
        setSeverities(sev)
      }
    }

    // Load active medicines + today's logs
    const { data: meds } = await supabase
      .from('medicines').select('*')
      .eq('pregnancy_id', pregnancy.id).eq('active', true)
      .order('created_at')

    if (meds?.length) {
      setMedicines(meds)
      const { data: medLogData } = await supabase
        .from('medicine_logs').select('*')
        .in('medicine_id', meds.map((m: Medicine) => m.id))
        .eq('date', today)
      const logMap: Record<string, boolean> = {}
      medLogData?.forEach((l: MedicineLog) => { logMap[l.medicine_id] = l.taken })
      setMedLogs(logMap)
    }

    setLoading(false)
  }

  function handleSymptomToggle(selected: string[]) {
    setSymptoms(selected)
    const newSev = { ...severities }
    selected.forEach((s) => { if (!newSev[s]) newSev[s] = 5 })
    setSeverities(newSev)
  }

  async function toggleMedicineTaken(medicineId: string) {
    const current = medLogs[medicineId] ?? false
    setMedLogs((prev) => ({ ...prev, [medicineId]: !current }))
    const supabase = createClient()
    await supabase.from('medicine_logs').upsert(
      { medicine_id: medicineId, date: today, taken: !current },
      { onConflict: 'medicine_id,date' }
    )
  }

  async function handleSave() {
    if (!pregnancyId) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: log, error } = await supabase
      .from('daily_logs')
      .upsert({
        pregnancy_id:  pregnancyId,
        date:          today,
        logged_by:     user.id,
        mood:          mood || null,
        water_glasses: water,
        sleep_hours:   sleep,
        notes:         notes || null,
      }, { onConflict: 'pregnancy_id,date' })
      .select('id')
      .single()

    if (error || !log) { setSaving(false); return }

    await supabase.from('symptoms').delete().eq('log_id', log.id)
    if (symptoms.length) {
      await supabase.from('symptoms').insert(
        symptoms.map((s) => ({
          log_id: log.id, symptom_type: s, severity: severities[s] ?? 5,
        }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">📋</div>
      </div>
    )
  }

  const medTakenCount = medicines.filter((m) => medLogs[m.id]).length

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-2xl font-bold text-gray-900">Daily Log</h1>
      </div>

      {/* ── Mood ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <p className="text-sm font-semibold text-gray-700">How are you feeling today?</p>
          </div>
        </CardHeader>
        <CardBody><EmojiMoodPicker value={mood} onChange={setMood} /></CardBody>
      </Card>

      {/* ── Medicines ── */}
      {medicines.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-semibold text-gray-700">Medicines</p>
              </div>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                medTakenCount === medicines.length
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              )}>
                {medTakenCount}/{medicines.length} taken
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {medicines.map((med) => {
              const taken = medLogs[med.id] ?? false
              return (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => toggleMedicineTaken(med.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all active:scale-98 text-left',
                    taken
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-100 hover:border-purple-200 hover:bg-purple-50'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                    taken ? 'bg-green-500' : 'bg-white border-2 border-dashed border-gray-300'
                  )}>
                    {taken && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', taken ? 'line-through text-gray-400' : 'text-gray-800')}>
                      {med.name}
                    </p>
                    {(med.dosage || med.times.length > 0) && (
                      <p className="text-xs text-gray-400">
                        {[med.dosage, med.times.join(' · ')].filter(Boolean).join(' — ')}
                      </p>
                    )}
                  </div>
                  {taken && <span className="text-xs font-semibold text-green-600">✓</span>}
                </button>
              )
            })}
          </CardBody>
        </Card>
      )}

      {/* ── Symptoms ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <p className="text-sm font-semibold text-gray-700">Symptoms</p>
            {symptoms.length > 0 && (
              <span className="text-xs font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                {symptoms.length} selected
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <ChipGrid options={SYMPTOMS} selected={symptoms} onChange={handleSymptomToggle} />

          {symptoms.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 tracking-wide">SEVERITY (1 = mild · 10 = severe)</p>
              {symptoms.map((s) => (
                <div key={s} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{s}</span>
                    <span className={cn(
                      'text-sm font-bold px-2.5 py-0.5 rounded-full',
                      (severities[s] ?? 5) >= 7 ? 'bg-red-100 text-red-600'
                      : (severities[s] ?? 5) >= 4 ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-600'
                    )}>
                      {severities[s] ?? 5}
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={10}
                    value={severities[s] ?? 5}
                    onChange={(e) => setSeverities({ ...severities, [s]: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Water + Sleep ── */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Droplets className="w-4 h-4 text-blue-400" />
              <p className="text-xs font-semibold text-gray-600">Water</p>
            </div>
            <WaterGlasses value={water} onChange={setWater} min={0} max={20} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" />
                <p className="text-xs font-semibold text-gray-600">Sleep</p>
              </div>
              <span className="text-sm font-bold text-indigo-500">{sleep}h</span>
            </div>
            <input
              type="range" min={0} max={14} step={0.5}
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0h</span><span>14h</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Notes ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-gray-700">Notes</p>
          </div>
        </CardHeader>
        <CardBody>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else to note today…"
            rows={3}
            className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none bg-transparent"
          />
        </CardBody>
      </Card>

      {/* ── Save ── */}
      <div className="pb-4">
        {saved ? (
          <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl py-4 font-semibold">
            <CheckCircle className="w-5 h-5" />
            Saved!
          </div>
        ) : (
          <Button size="lg" className="w-full shadow-md" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Today\'s Log'}
          </Button>
        )}
      </div>
    </div>
  )
}
