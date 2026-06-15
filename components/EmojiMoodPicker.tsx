'use client'

// Switch-case returns full class strings — Tailwind can statically scan these.
// Ring color class is included so Tailwind doesn't purge it.
function moodStyle(value: number, selected: boolean) {
  if (!selected) return 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
  switch (value) {
    case 1: return 'bg-red-500 border-red-500 text-white shadow-lg ring-red-300'
    case 2: return 'bg-orange-400 border-orange-400 text-white shadow-lg ring-orange-200'
    case 3: return 'bg-amber-400 border-amber-400 text-white shadow-lg ring-amber-200'
    case 4: return 'bg-lime-500 border-lime-500 text-white shadow-lg ring-lime-300'
    case 5: return 'bg-green-500 border-green-500 text-white shadow-lg ring-green-300'
    default: return ''
  }
}

const MOODS = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Bad'   },
  { value: 3, emoji: '😐', label: 'Okay'  },
  { value: 4, emoji: '🙂', label: 'Good'  },
  { value: 5, emoji: '😊', label: 'Great' },
]

interface EmojiMoodPickerProps {
  value?: number
  onChange: (value: number) => void
}

export function EmojiMoodPicker({ value, onChange }: EmojiMoodPickerProps) {
  return (
    <div className="flex gap-2">
      {MOODS.map((mood) => {
        const selected = value === mood.value
        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2
              transition-all duration-150 cursor-pointer select-none
              ${selected ? 'scale-110 -translate-y-1 ring-2 ring-offset-2' : ''}
              ${moodStyle(mood.value, selected)}
            `}
          >
            <span className="text-[26px] leading-none">{mood.emoji}</span>
            <span className={`text-[10px] font-bold leading-none ${selected ? 'text-white' : 'text-gray-400'}`}>
              {mood.label}
            </span>
            {selected && <span className="text-white text-[9px] font-black leading-none">✓</span>}
          </button>
        )
      })}
    </div>
  )
}
