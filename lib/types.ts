export type Mood = 1 | 2 | 3 | 4 | 5

export interface Profile {
  id: string
  name: string
  avatar_url?: string
}

export interface Pregnancy {
  id: string
  owner_id: string
  partner_id?: string
  lmp_date: string
  due_date: string
  baby_name?: string
  join_code: string
}

export interface DailyLog {
  id: string
  pregnancy_id: string
  date: string
  logged_by: string
  mood?: number
  water_glasses?: number
  sleep_hours?: number
  notes?: string
}

export interface Symptom {
  id: string
  log_id: string
  symptom_type: string
  severity: number
}

export interface Medicine {
  id: string
  pregnancy_id: string
  name: string
  dosage?: string
  times: string[]
  active: boolean
}

export interface MedicineLog {
  id: string
  medicine_id: string
  date: string
  taken: boolean
}

export interface KickSession {
  id: string
  pregnancy_id: string
  date: string
  kick_count: number
  duration_minutes?: number
  created_at: string
}

export interface WeightLog {
  id: string
  pregnancy_id: string
  date: string
  weight_kg: number
  logged_by: string
}

export interface Appointment {
  id: string
  pregnancy_id: string
  date: string
  type: string
  location?: string
  notes?: string
}
