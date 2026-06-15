import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateWeek,
  calculateDueDate,
  daysUntilDue,
  formatDueDate,
  getFruitSize,
  generateJoinCode,
} from '@/lib/pregnancy'

describe('calculateWeek', () => {
  it('returns 0 for a today LMP', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(calculateWeek(today)).toBe(0)
  })

  it('returns correct week for known date', () => {
    // 10 weeks ago
    const lmp = new Date()
    lmp.setDate(lmp.getDate() - 70)
    expect(calculateWeek(lmp.toISOString().split('T')[0])).toBe(10)
  })

  it('never returns a negative number', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(calculateWeek(future.toISOString().split('T')[0])).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateDueDate', () => {
  it('adds exactly 280 days to LMP', () => {
    const lmp = new Date(2024, 0, 1) // Jan 1 2024 in local time (no timezone shift)
    const lmpStr = lmp.toISOString().split('T')[0]
    const due = calculateDueDate(lmpStr)
    const diffMs = due.getTime() - lmp.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(280)
  })
})

describe('daysUntilDue', () => {
  it('returns 0 if due date is in the past', () => {
    expect(daysUntilDue('2020-01-01')).toBe(0)
  })

  it('returns positive number for future due date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    const result = daysUntilDue(future.toISOString().split('T')[0])
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThanOrEqual(30)
  })
})

describe('formatDueDate', () => {
  it('formats date as "Month D, YYYY"', () => {
    expect(formatDueDate('2024-10-07')).toBe('October 7, 2024')
  })

  it('formats single-digit day without leading zero', () => {
    expect(formatDueDate('2024-03-05')).toBe('March 5, 2024')
  })
})

describe('getFruitSize', () => {
  it('returns microscopic size before week 4', () => {
    expect(getFruitSize(2).size).toBe('microscopic')
    expect(getFruitSize(3).fruit).toBe('tiny embryo')
  })

  it('returns correct fruit at week 12 (lime)', () => {
    const result = getFruitSize(12)
    expect(result.fruit).toBe('lime')
    expect(result.emoji).toBe('🍋')
  })

  it('returns week 40 size for anything beyond week 40', () => {
    const at40 = getFruitSize(40)
    const at42 = getFruitSize(42)
    expect(at42.fruit).toBe(at40.fruit)
  })

  it('returns a fallback for any week in range', () => {
    for (let w = 4; w <= 40; w++) {
      const result = getFruitSize(w)
      expect(result.fruit).toBeTruthy()
      expect(result.emoji).toBeTruthy()
    }
  })
})

describe('generateJoinCode', () => {
  it('generates a 6-character code', () => {
    expect(generateJoinCode()).toHaveLength(6)
  })

  it('uses only allowed characters (no ambiguous chars like 0, O, I, 1)', () => {
    const ALLOWED = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 20; i++) {
      expect(generateJoinCode()).toMatch(ALLOWED)
    }
  })

  it('generates unique codes (probabilistic)', () => {
    const codes = new Set(Array.from({ length: 100 }, generateJoinCode))
    expect(codes.size).toBeGreaterThan(90)
  })
})
