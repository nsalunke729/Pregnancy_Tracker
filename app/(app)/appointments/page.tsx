'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Appointment, QAItem } from '@/lib/types'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, MapPin, Trash2, ChevronDown, ChevronUp, MessageSquarePlus, Send } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const APPT_TYPES = ['OB Check-up', 'Ultrasound', 'Blood Test', 'Glucose Test', 'NST', 'Other']

export default function AppointmentsPage() {
  const router = useRouter()
  const [pregnancyId,   setPregnancyId]   = useState<string | null>(null)
  const [appointments,  setAppointments]  = useState<Appointment[]>([])
  const [showForm,      setShowForm]      = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  // Add form
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
      .eq('pregnancy_id', pregnancy.id).order('date')
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
      .insert({ pregnancy_id: pregnancyId, date, type, location: location || null, notes: notes || null, questions: [] })
      .select().single()
    if (data) {
      setAppointments((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setDate(''); setType(APPT_TYPES[0]); setLocation(''); setNotes(''); setShowForm(false)
      setExpandedId(data.id)  // auto-expand so user can add questions right away
    }
    setSaving(false)
  }

  async function deleteAppointment(id: string) {
    const supabase = createClient()
    await supabase.from('appointments').delete().eq('id', id)
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function saveQuestions(id: string, questions: QAItem[]) {
    const supabase = createClient()
    await supabase.from('appointments').update({ questions }).eq('id', id)
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, questions } : a))
  }

  const upcoming = appointments.filter((a) => !isPast(parseISO(a.date)))
  const past     = appointments.filter((a) => isPast(parseISO(a.date)))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-4xl animate-pulse">📅</div>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-rose-400 text-sm font-medium">Schedule</p>
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
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white">
                {APPT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="General notes (optional)" rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              <p className="text-[11px] text-gray-400">💡 After adding, you can save questions to ask and note the doctor&apos;s answers.</p>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={saving || !date}>
                  {saving ? 'Adding…' : 'Add'}
                </Button>
                <Button type="button" size="sm" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
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
              <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3">UPCOMING</p>
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <ApptCard
                    key={a.id} a={a}
                    expanded={expandedId === a.id}
                    onExpand={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    onDelete={deleteAppointment}
                    onSaveQuestions={saveQuestions}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3 mt-4">PAST</p>
              <div className="space-y-2">
                {past.slice().reverse().map((a) => (
                  <ApptCard
                    key={a.id} a={a}
                    expanded={expandedId === a.id}
                    onExpand={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    onDelete={deleteAppointment}
                    onSaveQuestions={saveQuestions}
                    past
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Appointment Card with Q&A ────────────────────────── */
function ApptCard({
  a, expanded, past = false,
  onExpand, onDelete, onSaveQuestions,
}: {
  a: Appointment
  expanded: boolean
  past?: boolean
  onExpand: () => void
  onDelete: (id: string) => void
  onSaveQuestions: (id: string, questions: QAItem[]) => Promise<void>
}) {
  const [items,       setItems]       = useState<QAItem[]>(a.questions ?? [])
  const [newQuestion, setNewQuestion] = useState('')
  const [addingQ,     setAddingQ]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [dirty,       setDirty]       = useState(false)

  function addQuestion() {
    if (!newQuestion.trim()) return
    const next = [...items, { id: crypto.randomUUID(), q: newQuestion.trim(), a: '' }]
    setItems(next)
    setNewQuestion('')
    setAddingQ(false)
    setDirty(true)
  }

  function updateAnswer(id: string, answer: string) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, a: answer } : item))
    setDirty(true)
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    await onSaveQuestions(a.id, items)
    setDirty(false)
    setSaving(false)
  }

  const totalQ   = items.length
  const answered = items.filter((i) => i.a.trim()).length

  return (
    <Card className={cn(past && 'opacity-70')}>
      <CardBody className="py-3">
        {/* Header row */}
        <div className="flex gap-3">
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
            {a.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.notes}</p>}
            {/* Q&A badge */}
            {totalQ > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-semibold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                  {answered}/{totalQ} answered
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button onClick={() => onDelete(a.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onExpand} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Q&A Expanded Section ── */}
        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">Questions &amp; Answers</p>
              <button
                onClick={() => setAddingQ(true)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Add question
              </button>
            </div>

            {/* Add question input */}
            {addingQ && (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuestion() } }}
                  placeholder="What would you like to ask the doctor?"
                  className="flex-1 px-3 py-2 rounded-xl border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                />
                <button onClick={addQuestion} className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setAddingQ(false); setNewQuestion('') }}
                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold flex-shrink-0">
                  ✕
                </button>
              </div>
            )}

            {/* Q&A list */}
            {items.length === 0 && !addingQ && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">No questions yet</p>
                <p className="text-xs text-gray-300 mt-1">Tap "Add question" to prepare for your visit</p>
              </div>
            )}

            {items.map((item, idx) => (
              <div key={item.id} className="space-y-1.5">
                {/* Question */}
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-800 flex-1">{item.q}</p>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 p-0.5 flex-shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {/* Answer */}
                <div className="ml-7">
                  <textarea
                    value={item.a}
                    onChange={(e) => updateAnswer(item.id, e.target.value)}
                    placeholder="Doctor's answer… (fill in after the visit)"
                    rows={item.a ? Math.min(4, item.a.split('\n').length + 1) : 2}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors',
                      item.a
                        ? 'bg-violet-50 border-violet-200 text-gray-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    )}
                  />
                </div>
              </div>
            ))}

            {/* Save button — shown when there are unsaved changes */}
            {(dirty || items.length > 0) && (
              <Button
                size="sm"
                className={cn('w-full', !dirty && 'opacity-50')}
                disabled={!dirty || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving…' : dirty ? 'Save Q&A' : 'Saved ✓'}
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
