import { differenceInDays, differenceInWeeks, addDays, format } from 'date-fns'

export function calculateWeek(lmpDate: string): number {
  const lmp = new Date(lmpDate)
  const today = new Date()
  return Math.max(0, differenceInWeeks(today, lmp))
}

export function calculateDueDate(lmpDate: string): Date {
  return addDays(new Date(lmpDate), 280)
}

export function daysUntilDue(dueDate: string): number {
  return Math.max(0, differenceInDays(new Date(dueDate), new Date()))
}

export function formatDueDate(dueDate: string): string {
  return format(new Date(dueDate), 'MMMM d, yyyy')
}

const FRUIT_SIZES: Record<number, { fruit: string; emoji: string; size: string }> = {
  4:  { fruit: 'poppy seed',       emoji: '🌸', size: '0.1 cm' },
  5:  { fruit: 'sesame seed',      emoji: '🌱', size: '0.2 cm' },
  6:  { fruit: 'pea',              emoji: '🟢', size: '0.6 cm' },
  7:  { fruit: 'blueberry',        emoji: '🫐', size: '1.2 cm' },
  8:  { fruit: 'raspberry',        emoji: '🍇', size: '1.6 cm' },
  9:  { fruit: 'cherry',           emoji: '🍒', size: '2.3 cm' },
  10: { fruit: 'strawberry',       emoji: '🍓', size: '3.1 cm' },
  11: { fruit: 'fig',              emoji: '🍑', size: '4.1 cm' },
  12: { fruit: 'lime',             emoji: '🍋', size: '5.4 cm' },
  13: { fruit: 'lemon',            emoji: '🍋', size: '7.4 cm' },
  14: { fruit: 'peach',            emoji: '🍑', size: '8.7 cm' },
  15: { fruit: 'apple',            emoji: '🍎', size: '10.1 cm' },
  16: { fruit: 'avocado',          emoji: '🥑', size: '11.6 cm' },
  17: { fruit: 'pear',             emoji: '🍐', size: '13 cm' },
  18: { fruit: 'sweet potato',     emoji: '🍠', size: '14.2 cm' },
  19: { fruit: 'mango',            emoji: '🥭', size: '15.3 cm' },
  20: { fruit: 'banana',           emoji: '🍌', size: '25.6 cm' },
  21: { fruit: 'carrot',           emoji: '🥕', size: '26.7 cm' },
  22: { fruit: 'coconut',          emoji: '🥥', size: '27.8 cm' },
  23: { fruit: 'grapefruit',       emoji: '🍊', size: '28.9 cm' },
  24: { fruit: 'corn',             emoji: '🌽', size: '30 cm' },
  25: { fruit: 'cauliflower',      emoji: '🥦', size: '34.6 cm' },
  26: { fruit: 'head of lettuce',  emoji: '🥬', size: '35.6 cm' },
  27: { fruit: 'cabbage',          emoji: '🥗', size: '36.6 cm' },
  28: { fruit: 'eggplant',         emoji: '🍆', size: '37.6 cm' },
  29: { fruit: 'butternut squash', emoji: '🎃', size: '38.6 cm' },
  30: { fruit: 'cucumber',         emoji: '🥒', size: '39.9 cm' },
  31: { fruit: 'pineapple',        emoji: '🍍', size: '41.1 cm' },
  32: { fruit: 'squash',           emoji: '🎃', size: '42.4 cm' },
  33: { fruit: 'cantaloupe',       emoji: '🍈', size: '43.7 cm' },
  34: { fruit: 'honeydew melon',   emoji: '🍈', size: '45 cm' },
  35: { fruit: 'coconut',          emoji: '🥥', size: '46.2 cm' },
  36: { fruit: 'romaine head',     emoji: '🥬', size: '47.4 cm' },
  37: { fruit: 'swiss chard',      emoji: '🥬', size: '48.6 cm' },
  38: { fruit: 'leek',             emoji: '🧅', size: '49.8 cm' },
  39: { fruit: 'watermelon',       emoji: '🍉', size: '50.7 cm' },
  40: { fruit: 'small pumpkin',    emoji: '🎃', size: '51.2 cm' },
}

export function getFruitSize(week: number) {
  if (week < 4)  return { fruit: 'tiny embryo', emoji: '🌸', size: 'microscopic' }
  if (week > 40) return FRUIT_SIZES[40]
  return FRUIT_SIZES[week] ?? { fruit: 'growing baby', emoji: '👶', size: '—' }
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const SYMPTOMS = [
  'Nausea', 'Vomiting', 'Fatigue', 'Headache', 'Back Pain',
  'Heartburn', 'Swelling', 'Cramps', 'Spotting', 'Dizziness',
  'Breast Tenderness', 'Constipation', 'Frequent Urination',
  'Shortness of Breath', 'Insomnia', 'Mood Swings', 'Food Cravings',
  'Round Ligament Pain', 'Braxton Hicks', 'Pelvic Pressure',
]
