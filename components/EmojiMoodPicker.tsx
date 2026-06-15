'use client'

// Selected classes must be full strings — Tailwind purges dynamic class assembly.
// Colors are intentionally solid (not -100 pastels) so selection is unmistakable.
function moodStyle(value: number, selected: boolean) {
  if (!selected) return 'bg-white border-gray-200 text-gray-500'
  switch (value) {
    case 1: return 'bg-red-500 border-red-500 text-white shadow-md'
    case 2: return 'bg-orange-400 border-orange-400 text-white shadow-md'
    case 3: return 'bg-amber-400 border-amber-400 text-white shadow-md'
    case 4: return 'bg-lime-500 border-lime-500 text-white shadow-md'
    case 5: return 'bg-green-500 border-green-500 text-white shadow-md'
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
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none ${
              selected ? 'scale-105' : 'hover:bg-gray-50 hover:border-gray-300'
            } ${moodStyle(mood.value, selected)}`}
          >
            <span className="text-[26px] leading-none">{mood.emoji}</span>
            <span className={`text-[10px] font-bold leading-none ${selected ? 'text-white' : 'text-gray-400'}`}>
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
