'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateDueDate, generateJoinCode } from '@/lib/pregnancy'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice')
  const [lmpDate, setLmpDate]   = useState('')
  const [babyName, setBabyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dueDate = calculateDueDate(lmpDate)
    const code    = generateJoinCode()

    const { error } = await supabase.from('pregnancies').insert({
      owner_id:  user.id,
      lmp_date:  lmpDate,
      due_date:  format(dueDate, 'yyyy-MM-dd'),
      baby_name: babyName || null,
      join_code: code,
    })

    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    // Direct SELECT/UPDATE would fail — RLS blocks rows where you're not yet
    // owner_id/partner_id. The RPC runs as security definer and handles both
    // the lookup and the partner_id update atomically.
    const { data, error: rpcErr } = await supabase
      .rpc('join_pregnancy_by_code', { p_join_code: joinCode.trim() })

    if (rpcErr) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    if (data?.error === 'not_found') {
      setError('Invalid code. Please check and try again.')
      setLoading(false)
    } else if (data?.error === 'own_pregnancy') {
      setError('You cannot join your own pregnancy.')
      setLoading(false)
    } else if (data?.error === 'already_joined') {
      setError('This pregnancy already has a partner linked.')
      setLoading(false)
    } else if (data?.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">👶</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Let&apos;s get started</h1>
          <p className="text-gray-500 text-sm mb-10">Are you setting up a new pregnancy or joining your partner&apos;s?</p>
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={() => setStep('create')}>
              🌸 Set up my pregnancy
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => setStep('join')}>
              🤝 Join partner&apos;s pregnancy
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🤝</div>
            <h1 className="text-xl font-bold text-gray-900">Join your partner</h1>
            <p className="text-gray-500 text-sm mt-1">Enter the 6-character code from your partner&apos;s app</p>
          </div>
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              required
              className="w-full px-4 py-4 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white uppercase"
            />
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Joining…' : 'Join Pregnancy'}
            </Button>
            <Button type="button" size="lg" variant="ghost" className="w-full" onClick={() => setStep('choice')}>
              Back
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-xl font-bold text-gray-900">Set up your pregnancy</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll calculate your due date automatically</p>
        </div>
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              First day of last period (LMP)
            </label>
            <input
              type="date"
              value={lmpDate}
              onChange={(e) => setLmpDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
          <Button type="submit" size="lg" className="w-full" disabled={loading || !lmpDate}>
            {loading ? 'Setting up…' : 'Start Tracking 🎉'}
          </Button>
          <Button type="button" size="lg" variant="ghost" className="w-full" onClick={() => setStep('choice')}>
            Back
          </Button>
        </form>
      </div>
    </div>
  )
}
