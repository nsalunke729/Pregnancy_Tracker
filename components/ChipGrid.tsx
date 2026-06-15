'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipGridProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function ChipGrid({ options, selected, onChange }: ChipGridProps) {
  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border-2 transition-all active:scale-95 cursor-pointer select-none',
              isSelected
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200 hover:border-gray-200'
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
            {option}
          </button>
        )
      })}
    </div>
  )
}
