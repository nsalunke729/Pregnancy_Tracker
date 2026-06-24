'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Slide {
  emoji: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    emoji: '🤰',
    title: 'Welcome to Pregnancy Tracker',
    body: 'Your daily companion for the next nine months — track how you feel, share progress with your partner, and never miss a beat.',
  },
  {
    emoji: '📋',
    title: 'Log Your Day',
    body: 'One quick check-in for mood, symptoms, water, sleep, and medicines — all from the Log tab.',
  },
  {
    emoji: '💊',
    title: 'Never Miss a Dose',
    body: 'Add medicines with reminders and an optional course length (like "take for 1 week") — completed courses tidy themselves away.',
  },
  {
    emoji: '👶',
    title: 'Feel Every Kick',
    body: 'Count kicks and watch your weekly movement trend. In the third trimester, switch to the Contraction Timer when it\'s time.',
  },
  {
    emoji: '📆',
    title: 'Your Whole Journey',
    body: 'Browse History by week or month, and export your full log as a CSV to share with your doctor or midwife.',
  },
  {
    emoji: '💕',
    title: 'Share With Your Partner',
    body: 'Give your partner the join code from your Dashboard so you can both log and follow along together. Check the Symptom Guide anytime you\'re unsure what\'s normal.',
  },
]

export function WelcomeTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step === SLIDES.length - 1
  const slide = SLIDES[step]

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="relative px-6 pt-8 pb-6 text-center">
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 text-xs font-semibold text-gray-400 hover:text-gray-600"
          >
            Skip
          </button>
          <div className="text-6xl mb-4">{slide.emoji}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{slide.body}</p>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 pb-5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-6 bg-rose-500' : 'w-1.5 bg-gray-200'
              )}
            />
          ))}
        </div>

        <div className="px-6 pb-6 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold flex-shrink-0"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? onComplete() : setStep((s) => s + 1))}
            className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white text-sm font-semibold active:scale-98 transition-transform"
          >
            {isLast ? "Let's go 🎉" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
