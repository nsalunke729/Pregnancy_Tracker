'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Appointment } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, MapPin, Trash2 } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'

const APPT_TYPES = ['OB Check-up', 'Ultrasound', 'Blood Test', 'Glucose Test', 'NST', 'Other']

export default function AppointmentsPage() {
  const router = useRouter()
  const [pregnancyId, setPregnancyId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showForm, setShowForm]  = useState(false)
  const [loading, setLoading]    = useState(true)
  const [saving,  setSaving]     = useState(false)
  // Form
  const [date,     setDate]     = useState('')
  const [type,     setType]     = useState(APPT_TYPES[0])
  const [location, setLocation] = useState('')
  const [notes,    setNotes]    = useState('')

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
      .from('appointments').select('*')
      .eq('pregnancy_id', pregnancy.id)
      .order('date')

    setAppointments(data ?? [])
    setLoading(false)
  }

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault()
    if (!pregnancyId) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('appointments')
      .insert({ pregnancy_id: pregnancyId, date, type, location: location || null, notes: notes || null })
      .select().single()

    if (data) {
      setAppointments((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setDate(''); setType(APPT_TYPES[0]); setLocation(''); setNotes(''); setShowForm(false)
    }
    setSaving(false)
  }

  async function deleteAppointment(id: string) {
    const supabase = createClient()
    await supabase.from('appointments').delete().eq('id', id)
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  const upcoming = appointments.filter((a) => !isPast(parseISO(a.date)))
  const past     = appointments.filter((a) => isPast(parseISO(a.date)))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">📅</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">Schedule</p>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        </div>
        <Button size="icon" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {showForm && (
        <Card className="border-rose-100">
          <CardBody>
            <p className="font-semibold text-gray-800 text-sm mb-3">Add Appointment</p>
            <form onSubmit={addAppointment} className="space-y-3">
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              >
                {APPT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={saving || !date}>
                  {saving ? 'Adding…' : 'Add'}
                </Button>
                <Button type="button" size="sm" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-sm">No appointments yet</p>
          <p className="text-xs mt-1">Tap + to add your first appointment</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3">UPCOMING</p>
              <div className="space-y-2">
                {upcoming.map((a) => <ApptCard key={a.id} a={a} onDelete={deleteAppointment} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3 mt-4">PAST</p>
              <div className="space-y-2 opacity-60">
                {past.slice().reverse().map((a) => <ApptCard key={a.id} a={a} onDelete={deleteAppointment} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ApptCard({ a, onDelete }: { a: Appointment; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardBody className="flex gap-3 py-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{a.type}</p>
          <p className="text-xs text-gray-500">{format(parseISO(a.date), 'EEE, MMM d · h:mm a')}</p>
          {a.location && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{a.location}
            </p>
          )}
          {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.notes}</p>}
        </div>
        <button
          onClick={() => onDelete(a.id)}
          className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </CardBody>
    </Card>
  )
}
