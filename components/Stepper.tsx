'use client'

import { Minus, Plus } from 'lucide-react'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
}

export function Stepper({ value, onChange, min = 0, max = 20, unit = '' }: StepperProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-2xl font-bold text-gray-800 min-w-[3rem] text-center">
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform shadow-sm"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
