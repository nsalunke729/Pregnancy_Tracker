'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/* ── Content ─────────────────────────────────────────── */
const NORMAL_SYMPTOMS = [
  {
    name: 'Frequent Urination',
    emoji: '🚽',
    why: 'Blood volume increases and the uterus presses directly on the bladder.',
  },
  {
    name: 'Bloating & Constipation',
    emoji: '😮‍💨',
    why: 'Progesterone relaxes digestive muscles, slowing digestion and trapping gas.',
  },
  {
    name: 'Mood Swings',
    emoji: '😅',
    why: 'Rapid hormone shifts (progesterone & hCG) affect mood regulation.',
  },
  {
    name: 'Heightened Sense of Smell',
    emoji: '👃',
    why: 'Hormone-driven sensitivity — everyday smells like cooking oil or coffee can trigger nausea.',
  },
  {
    name: 'Excessive Saliva / Metallic Taste',
    emoji: '💧',
    why: 'Called dysgeusia — very common in early pregnancy, caused by hCG.',
  },
  {
    name: 'Mild Headaches',
    emoji: '🤕',
    why: 'Caused by rapid hormone shifts and changes in blood circulation volume.',
  },
  {
    name: 'Lower Backache',
    emoji: '🔙',
    why: 'Ligaments naturally soften and stretch in preparation for the growing uterus.',
  },
]

const TIPS = [
  {
    title: 'Constipation',
    emoji: '💧',
    color: 'blue',
    tips: [
      'Drink at least 2 litres of water daily',
      'Eat fiber-rich foods: oats, wholemeal bread, fruit',
      'Do NOT take OTC laxatives without asking a pharmacist first',
    ],
  },
  {
    title: 'Headaches',
    emoji: '😌',
    color: 'purple',
    tips: [
      'Rest in a dark, quiet room and stay hydrated',
      'Paracetamol is safe during pregnancy',
      'Avoid Ibuprofen, Nurofen, or Aspirin unless your doctor prescribes them',
    ],
  },
  {
    title: 'Bloating',
    emoji: '🥗',
    color: 'green',
    tips: [
      'Eat slowly and chew food thoroughly',
      'Go for short, gentle walks after meals to keep digestion moving',
      'Avoid carbonated drinks and gas-producing foods',
    ],
  },
  {
    title: 'Mood Swings',
    emoji: '💆',
    color: 'rose',
    tips: [
      'Rest when you feel overwhelmed — it\'s hormones, not you',
      'Talk to your partner about what you\'re feeling',
      'Light exercise like walking can help stabilise mood',
    ],
  },
]

const WATCH = [
  {
    title: 'Light Vaginal Spotting',
    emoji: '🩸',
    safe: 'Faint pink streaks or dark brown discharge when wiping, or small spots on a pantyliner.',
    action: 'Note down the date, time, and colour. Mention it at your next midwife appointment — it\'s usually implantation bleeding.',
    notSafe: 'Bright red blood, heavier than a panty-liner, or accompanied by cramping → go to Emergency immediately.',
  },
  {
    title: 'Mild Cramping',
    emoji: '🤰',
    safe: 'Mild, dull, period-like cramps in the lower abdomen in early pregnancy (uterus stretching).',
    action: 'Rest, use a warm (not hot) water bottle on your back, and track if it changes.',
    notSafe: 'Sharp, intense, or one-sided pain → call emergency.',
  },
  {
    title: 'Fatigue',
    emoji: '😴',
    safe: 'Extreme tiredness in the first trimester is completely normal — the body is working hard.',
    action: 'Rest when you can. Don\'t fight it. Iron levels can drop — mention persistent fatigue to your midwife.',
    notSafe: 'Fatigue with chest pain, breathlessness, or palpitations → consult immediately.',
  },
]

const EMERGENCY = [
  {
    sign: 'Heavy Bleeding',
    emoji: '🩸',
    detail: 'Bright red blood that looks like a heavy period, or requires changing a pad every hour.',
  },
  {
    sign: 'Severe Sharp Pain',
    emoji: '⚡',
    detail: 'Intense, sharp cramping or stabbing pain — especially on ONE side of the lower abdomen or pelvis.',
  },
  {
    sign: 'Shoulder Tip Pain',
    emoji: '🫷',
    detail: 'Sharp pain right at the shoulder/arm junction — can signal an ectopic pregnancy (internal bleeding).',
  },
  {
    sign: 'Uncontrollable Vomiting',
    emoji: '🤢',
    detail: 'Unable to keep any fluids down for more than 12–24 hours — risks severe dehydration.',
  },
  {
    sign: 'Vision Changes',
    emoji: '👁️',
    detail: 'Sudden blurred vision, severe dizziness, or flashing lights — can indicate pre-eclampsia.',
  },
]

type Tab = 'normal' | 'tips' | 'watch' | 'emergency'

const TABS: { id: Tab; label: string; emoji: string; color: string }[] = [
  { id: 'normal',    label: 'Normal',    emoji: '✅', color: 'green'  },
  { id: 'tips',      label: 'Tips',      emoji: '💡', color: 'blue'   },
  { id: 'watch',     label: 'Watch',     emoji: '👀', color: 'amber'  },
  { id: 'emergency', label: 'Emergency', emoji: '🚨', color: 'red'    },
]

const tabActive: Record<string, string> = {
  green:  'bg-green-500 text-white shadow-sm',
  blue:   'bg-blue-500 text-white shadow-sm',
  amber:  'bg-amber-500 text-white shadow-sm',
  red:    'bg-red-500 text-white shadow-sm',
}
const tabInactive = 'bg-white text-gray-500'

/* ── Page ─────────────────────────────────────────────── */
export default function GuidePage() {
  const [tab, setTab] = useState<Tab>('normal')

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-rose-400 text-sm font-medium">Reference</p>
        <h1 className="text-2xl font-bold text-gray-900">Symptom Guide</h1>
        <p className="text-xs text-gray-400 mt-1">Not a substitute for medical advice — always consult your doctor.</p>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1.5 bg-gray-100 rounded-2xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all',
              tab === t.id ? tabActive[t.color] : tabInactive
            )}
          >
            <span className="text-base leading-none flex-shrink-0">{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Normal Tab ── */}
      {tab === 'normal' && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="flex-shrink-0 leading-none">✅</span>
              <p className="text-sm font-bold text-green-800">Safe to Ignore</p>
            </div>
            <p className="text-xs text-green-600 mt-0.5">
              These are caused by rising pregnancy hormones (progesterone &amp; hCG) and are signs the pregnancy is progressing normally.
            </p>
          </div>
          {NORMAL_SYMPTOMS.map((s) => (
            <div key={s.name} className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.why}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tips Tab ── */}
      {tab === 'tips' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="flex-shrink-0 leading-none">💡</span>
              <p className="text-sm font-bold text-blue-800">Daily Management</p>
            </div>
            <p className="text-xs text-blue-600 mt-0.5">Simple things that help with common discomforts.</p>
          </div>
          {TIPS.map((section) => (
            <div key={section.title} className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl flex-shrink-0 leading-none">{section.emoji}</span>
                <p className="text-sm font-bold text-gray-900">{section.title}</p>
              </div>
              <ul className="space-y-1.5">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                    <span className="text-gray-300 mt-0.5 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ── Watch Tab ── */}
      {tab === 'watch' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="flex-shrink-0 leading-none">👀</span>
              <p className="text-sm font-bold text-amber-800">Monitor Carefully</p>
            </div>
            <p className="text-xs text-amber-600 mt-0.5">
              These can be normal OR a sign of something that needs attention. Knowing the difference matters.
            </p>
          </div>
          {WATCH.map((w) => (
            <div key={w.title} className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <span className="text-2xl flex-shrink-0 leading-none">{w.emoji}</span>
                <p className="text-sm font-bold text-gray-900">{w.title}</p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="flex-shrink-0 text-[10px] leading-none">✅</span>
                    <p className="text-[10px] font-bold text-green-600 tracking-wide">WHEN IT&apos;S OKAY</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{w.safe}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="flex-shrink-0 text-[10px] leading-none">📋</span>
                    <p className="text-[10px] font-bold text-blue-600 tracking-wide">WHAT TO DO</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{w.action}</p>
                </div>
                <div className="bg-red-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="flex-shrink-0 text-[10px] leading-none">🚨</span>
                    <p className="text-[10px] font-bold text-red-600 tracking-wide">SEEK HELP IF</p>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">{w.notSafe}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Emergency Tab ── */}
      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-300 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="flex-shrink-0 leading-none">🚨</span>
              <p className="text-sm font-bold text-red-800">Go to Emergency Immediately</p>
            </div>
            <p className="text-xs text-red-600 mt-0.5">
              If you experience ANY of these, do not wait for a scheduled appointment.
              Call your maternity hospital emergency line or go straight to the Emergency Room.
            </p>
          </div>
          {EMERGENCY.map((e, i) => (
            <div key={e.sign} className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-lg flex-shrink-0 leading-none">{e.emoji}</span>
                  <p className="text-sm font-bold text-red-900">{e.sign}</p>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">{e.detail}</p>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              This guide is for reference only. When in doubt, always call your midwife or maternity hospital.
              Trust your instincts — if something feels wrong, seek help.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
