import { addDays, differenceInCalendarDays } from 'date-fns'
import { Medicine } from './types'

export interface CourseStatus {
  ongoing: boolean        // no duration set -- no end date
  ended: boolean
  daysLeft: number | null // null when ongoing
  endDate: Date | null    // null when ongoing
}

export function getCourseStatus(med: Pick<Medicine, 'start_date' | 'duration_days'>): CourseStatus {
  if (!med.duration_days || !med.start_date) {
    return { ongoing: true, ended: false, daysLeft: null, endDate: null }
  }
  const endDate = addDays(new Date(med.start_date), med.duration_days)
  const daysLeft = differenceInCalendarDays(endDate, new Date())
  return { ongoing: false, ended: daysLeft < 0, daysLeft, endDate }
}

export const DURATION_PRESETS = [
  { label: 'Ongoing', value: null },
  { label: '3 days',  value: 3 },
  { label: '5 days',  value: 5 },
  { label: '1 week',  value: 7 },
  { label: '2 weeks', value: 14 },
  { label: '1 month', value: 30 },
] as const
