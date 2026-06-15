import { describe, it, expect } from 'vitest'
import type { QAItem, Appointment, Medicine, DailyLog } from '@/lib/types'

describe('QAItem', () => {
  it('is valid with all fields', () => {
    const item: QAItem = { id: 'abc', q: 'Any concerns?', a: 'All good.' }
    expect(item.id).toBe('abc')
    expect(item.q).toBe('Any concerns?')
    expect(item.a).toBe('All good.')
  })

  it('allows empty answer (pre-visit state)', () => {
    const item: QAItem = { id: 'x', q: 'What vitamins?', a: '' }
    expect(item.a).toBe('')
  })
})

describe('Appointment', () => {
  it('questions field is optional', () => {
    const appt: Appointment = {
      id: '1',
      pregnancy_id: 'p1',
      date: '2024-06-01T10:00:00Z',
      type: 'OB Check-up',
    }
    expect(appt.questions).toBeUndefined()
  })

  it('accepts questions array', () => {
    const appt: Appointment = {
      id: '1',
      pregnancy_id: 'p1',
      date: '2024-06-01T10:00:00Z',
      type: 'Ultrasound',
      questions: [
        { id: 'q1', q: 'Is baby growing on track?', a: 'Yes, 95th percentile.' },
      ],
    }
    expect(appt.questions).toHaveLength(1)
    expect(appt.questions![0].a).toBe('Yes, 95th percentile.')
  })
})

describe('Medicine', () => {
  it('times defaults to empty array', () => {
    const med: Medicine = {
      id: 'm1',
      pregnancy_id: 'p1',
      name: 'Folic Acid',
      times: [],
      active: true,
    }
    expect(med.times).toHaveLength(0)
  })

  it('accepts multiple times', () => {
    const med: Medicine = {
      id: 'm2',
      pregnancy_id: 'p1',
      name: 'Iron',
      dosage: '65 mg',
      times: ['Morning', 'Night'],
      active: true,
    }
    expect(med.times).toContain('Morning')
    expect(med.dosage).toBe('65 mg')
  })
})

describe('DailyLog', () => {
  it('accepts partial log (all optional fields omitted)', () => {
    const log: DailyLog = {
      id: 'l1',
      pregnancy_id: 'p1',
      date: '2024-06-01',
      logged_by: 'u1',
    }
    expect(log.mood).toBeUndefined()
    expect(log.water_glasses).toBeUndefined()
    expect(log.sleep_hours).toBeUndefined()
  })
})
