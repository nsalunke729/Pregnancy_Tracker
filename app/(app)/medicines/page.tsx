'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Medicine, MedicineLog } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, Check, Bell, BellOff, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  getNotificationPermission, requestNotificationPermission,
  registerServiceWorker, checkAndFireMedicineReminders,
  getNextReminderLabel, MedicineForReminder,
} from '@/lib/notifications'

const TIME_OPTIONS = [
  { label: 'Morning',   emoji: '🌅' },
  { label: 'Afternoon', emoji: '☀️' },
  { label: 'Evening',   emoji: '🌆' },
  { label: 'Night',     emoji: '🌙' },
]

export default function MedicinesPage() {
  const router  = useRouter()
  const today   = format(new Date(), 'yyyy-MM-dd')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [pregnancyId, setPregnancyId] = useState<string | null>(null)
  const [medicines,   setMedicines]   = useState<Medicine[]>([])
  const [logs,        setLogs]        = useState<Record<string, boolean>>({})
  const [showForm,    setShowForm]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [notifPerm,   setNotifPerm]   = useState<ReturnType<typeof getNotificationPermission>>('default')
  // Form state
  const [name,   setName]   = useState('')
  const [dosage, setDosage] = useState('')
  const [times,  setTimes]  = useState<string[]>(['Morning'])

  useEffect(() => {
    load()
    registerServiceWorker()
    setNotifPerm(getNotificationPermission())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Check reminders every minute
  useEffect(() => {
    if (!medicines.length) return
    const meds: MedicineForReminder[] = medicines.map((m) => ({ id: m.id, name: m.name, times: m.times }))
    checkAndFireMedicineReminders(meds, logs)
    intervalRef.current = setInterval(() => {
      checkAndFireMedicineReminders(meds, logs)
    }, 60_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [medicines, logs])

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

    const { data: meds } = await supabase
      .from('medicines').select('*')
      .eq('pregnancy_id', pregnancy.id).eq('active', true)
      .order('created_at')

    const { data: medLogs } = await supabase
      .from('medicine_logs').select('*')
      .in('medicine_id', (meds ?? []).map((m: Medicine) => m.id))
      .eq('date', today)

    const logMap: Record<string, boolean> = {}
    medLogs?.forEach((l: MedicineLog) => { logMap[l.medicine_id] = l.taken })

    setMedicines(meds ?? [])
    setLogs(logMap)
    setLoading(false)
  }

  async function toggleTaken(medicineId: string) {
    const current = logs[medicineId] ?? false
    setLogs((prev) => ({ ...prev, [medicineId]: !current }))
    const supabase = createClient()
    await supabase.from('medicine_logs').upsert(
      { medicine_id: medicineId, date: today, taken: !current },
      { onConflict: 'medicine_id,date' }
    )
  }

  async function addMedicine(e: React.FormEvent) {
    e.preventDefault()
    if (!pregnancyId) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('medicines')
      .insert({ pregnancy_id: pregnancyId, name, dosage: dosage || null, times, active: true })
      .select().single()

    if (data) {
      setMedicines((prev) => [...prev, data])
      setName(''); setDosage(''); setTimes(['Morning']); setShowForm(false)
    }
    setSaving(false)
  }

  async function deleteMedicine(id: string) {
    const supabase = createClient()
    await supabase.from('medicines').update({ active: false }).eq('id', id)
    setMedicines((prev) => prev.filter((m) => m.id !== id))
  }

  function toggleTime(t: string) {
    setTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  async function handleEnableNotifications() {
    const perm = await requestNotificationPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      new Notification('🌸 Reminders enabled!', {
        body: 'You\'ll be notified when it\'s time to take your medicines.',
        icon: '/icons/icon-192.png',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">💊</div>
      </div>
    )
  }

  const allTaken  = medicines.length > 0 && medicines.every((m) => logs[m.id])
  const takenCount = medicines.filter((m) => logs[m.id]).length
  const nextReminder = getNextReminderLabel(
    medicines.map((m) => ({ id: m.id, name: m.name, times: m.times }))
  )

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
        </div>
        <Button size="icon" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Notification banner */}
      {notifPerm === 'default' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-center">
          <Bell className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Enable Reminders</p>
            <p className="text-xs text-amber-600">Get notified at medicine times</p>
          </div>
          <Button size="sm" onClick={handleEnableNotifications} className="bg-amber-500 hover:bg-amber-600 flex-shrink-0 text-white">
            Enable
          </Button>
        </div>
      )}
      {notifPerm === 'granted' && nextReminder && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-xs text-green-700 font-medium">{nextReminder}</p>
        </div>
      )}
      {notifPerm === 'denied' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <BellOff className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-500">Notifications blocked — enable in browser/phone Settings</p>
        </div>
      )}

      {/* Progress summary */}
      {medicines.length > 0 && (
        <Card className={allTaken ? 'bg-green-50 border-green-200' : ''}>
          <CardBody className="py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Today&apos;s Progress</p>
              <span className={cn('text-sm font-bold', allTaken ? 'text-green-600' : 'text-rose-500')}>
                {takenCount}/{medicines.length}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', allTaken ? 'bg-green-500' : 'bg-rose-500')}
                style={{ width: `${medicines.length ? (takenCount / medicines.length) * 100 : 0}%` }}
              />
            </div>
            {allTaken && <p className="text-xs text-green-600 font-medium mt-2">🎉 All medicines taken today!</p>}
          </CardBody>
        </Card>
      )}

      {/* Add form */}
      {showForm && (
        <Card className="border-rose-200 shadow-md">
          <CardBody className="space-y-4">
            <p className="font-semibold text-gray-800">Add Medicine / Supplement</p>
            <form onSubmit={addMedicine} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Folic Acid, Iron, Vitamin D…"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Dosage (optional)</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 400mg, 1 tablet"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">When to take (tap to select)</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map(({ label, emoji }) => {
                    const selected = times.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleTime(label)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer',
                          selected
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200'
                        )}
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="text-sm font-semibold">{label}</span>
                        {selected && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1" disabled={saving || !name || times.length === 0}>
                  {saving ? 'Adding…' : 'Add Medicine'}
                </Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Medicine checklist */}
      {medicines.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">💊</div>
          <p className="text-sm font-medium">No medicines added yet</p>
          <p className="text-xs mt-1">Tap + to add your first medicine or supplement</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 tracking-wide">TAP TO MARK AS TAKEN</p>
          {medicines.map((med) => {
            const taken = logs[med.id] ?? false
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleTaken(med.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-98 text-left',
                  taken
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 shadow-sm hover:border-rose-200 hover:shadow-md'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  taken
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 border-2 border-dashed border-gray-300'
                )}>
                  {taken && <Check className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm', taken ? 'line-through text-gray-400' : 'text-gray-900')}>
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[med.dosage, med.times.join(' · ')].filter(Boolean).join(' — ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {taken && <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Done</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMedicine(med.id) }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
