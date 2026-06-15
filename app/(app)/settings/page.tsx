'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateDueDate } from '@/lib/pregnancy'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  const [pregnancyId,    setPregnancyId]    = useState<string | null>(null)
  const [babyName,       setBabyName]       = useState('')
  const [lmpDate,        setLmpDate]        = useState('')
  const [dueDate,        setDueDate]        = useState('')
  const [lmpAutoCalc,   setLmpAutoCalc]    = useState('')  // auto-calculated from LMP, for preview
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase
      .from('pregnancies').select('*')
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
      .limit(1).single()

    if (!p) { router.push('/onboarding'); return }

    setPregnancyId(p.id)
    setBabyName(p.baby_name ?? '')
    setLmpDate(p.lmp_date)
    setDueDate(p.due_date)
    setLmpAutoCalc(format(calculateDueDate(p.lmp_date), 'yyyy-MM-dd'))
    setLoading(false)
  }

  function handleLmpChange(newLmp: string) {
    setLmpDate(newLmp)
    if (newLmp) {
      const auto = format(calculateDueDate(newLmp), 'yyyy-MM-dd')
      setLmpAutoCalc(auto)
      setDueDate(auto)  // auto-fill due date; user can override below
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!pregnancyId) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('pregnancies')
      .update({
        baby_name: babyName.trim() || null,
        lmp_date:  lmpDate,
        due_date:  dueDate,
      })
      .eq('id', pregnancyId)

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-4xl animate-pulse">⚙️</div>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-rose-400 text-sm font-medium">Edit details</p>
        <h1 className="text-2xl font-bold text-gray-900">Pregnancy Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Baby details */}
        <Card>
          <CardBody className="space-y-4 pt-4">
            <p className="text-sm font-semibold text-gray-700">👶 Baby</p>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Baby&apos;s nickname <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Peanut, Bean, Nugget…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              />
            </div>
          </CardBody>
        </Card>

        {/* Dates */}
        <Card>
          <CardBody className="space-y-4 pt-4">
            <p className="text-sm font-semibold text-gray-700">📅 Dates</p>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                First day of last period (LMP)
              </label>
              <input
                type="date"
                value={lmpDate}
                onChange={(e) => handleLmpChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              />
              {lmpDate && lmpAutoCalc && (
                <p className="text-[11px] text-gray-400 mt-1.5 ml-1">
                  Auto-calculated due date: <span className="font-semibold text-gray-600">{format(parseISO(lmpAutoCalc), 'MMMM d, yyyy')}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Due Date
                <span className="text-gray-400 font-normal ml-1">— override if doctor gave a different date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              />
              {dueDate && lmpAutoCalc && dueDate !== lmpAutoCalc && (
                <p className="text-[11px] text-amber-600 mt-1.5 ml-1">
                  ⚠ Using doctor&apos;s date — differs from LMP auto-calculation by {
                    Math.abs(Math.round((new Date(dueDate).getTime() - new Date(lmpAutoCalc).getTime()) / 86400000))
                  } days
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={saving || !lmpDate || !dueDate}
        >
          {saving ? 'Saving…' : saved ? (
            <span className="flex items-center gap-2 justify-center">
              <Check className="w-4 h-4" /> Saved!
            </span>
          ) : 'Save Changes'}
        </Button>

      </form>
    </div>
  )
}
