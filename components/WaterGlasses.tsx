'use client'

import { GlassWater, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WaterGlassesProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  visibleMax?: number
}

export function WaterGlasses({ value, onChange, min = 0, max = 20, visibleMax = 8 }: WaterGlassesProps) {
  const overflow = value > visibleMax

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-center gap-1">
        {Array.from({ length: visibleMax }, (_, i) => {
          const filled = i < value
          return (
            <GlassWater
              key={i}
              className={cn(
                'w-5 h-5 transition-colors',
                filled ? 'text-blue-400 fill-blue-100' : 'text-gray-200'
              )}
            />
          )
        })}
        {overflow && (
          <span className="text-xs font-semibold text-blue-400 ml-0.5">+{value - visibleMax}</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xl font-bold text-gray-800 min-w-[2rem] text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
