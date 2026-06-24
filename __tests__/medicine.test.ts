import { describe, it, expect } from 'vitest'
import { getCourseStatus, DURATION_PRESETS } from '@/lib/medicine'
import { format, subDays } from 'date-fns'

describe('getCourseStatus', () => {
  it('is ongoing when duration_days is not set', () => {
    const status = getCourseStatus({ start_date: format(new Date(), 'yyyy-MM-dd'), duration_days: undefined })
    expect(status.ongoing).toBe(true)
    expect(status.ended).toBe(false)
    expect(status.daysLeft).toBeNull()
    expect(status.endDate).toBeNull()
  })

  it('is ongoing when start_date is not set', () => {
    const status = getCourseStatus({ start_date: undefined, duration_days: 7 })
    expect(status.ongoing).toBe(true)
  })

  it('has days left when course started today with a future duration', () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const status = getCourseStatus({ start_date: today, duration_days: 7 })
    expect(status.ongoing).toBe(false)
    expect(status.ended).toBe(false)
    expect(status.daysLeft).toBe(7)
  })

  it('is ended when the course duration has fully elapsed', () => {
    const start = format(subDays(new Date(), 10), 'yyyy-MM-dd')
    const status = getCourseStatus({ start_date: start, duration_days: 7 })
    expect(status.ended).toBe(true)
    expect(status.daysLeft).toBeLessThan(0)
  })

  it('is not yet ended on the last day of the course', () => {
    const start = format(subDays(new Date(), 7), 'yyyy-MM-dd')
    const status = getCourseStatus({ start_date: start, duration_days: 7 })
    expect(status.ended).toBe(false)
    expect(status.daysLeft).toBe(0)
  })
})

describe('DURATION_PRESETS', () => {
  it('includes an Ongoing option with null value', () => {
    const ongoing = DURATION_PRESETS.find((p) => p.label === 'Ongoing')
    expect(ongoing?.value).toBeNull()
  })

  it('has all positive numeric values except Ongoing', () => {
    for (const preset of DURATION_PRESETS) {
      if (preset.label !== 'Ongoing') {
        expect(preset.value).toBeGreaterThan(0)
      }
    }
  })
})
