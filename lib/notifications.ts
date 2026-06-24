export interface MedicineForReminder {
  id: string
  name: string
  times: string[]
}

export const MEDICINE_SCHEDULE: Record<string, { hour: number; emoji: string; greeting: string }> = {
  Morning:   { hour: 8,  emoji: '🌅', greeting: 'Good morning! Time to take' },
  Afternoon: { hour: 13, emoji: '☀️', greeting: 'Afternoon check-in! Have you taken your' },
  Evening:   { hour: 18, emoji: '🌆', greeting: 'Evening reminder! Take your' },
  Night:     { hour: 21, emoji: '🌙', greeting: 'Bedtime reminder: Take your' },
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch {
      // Service worker registration failed — notifications will still work via Notification API
    }
  }
}

function readReminderFlag(key: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

function writeReminderFlag(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, '1')
  } catch {
    // Storage blocked (private browsing / restricted PWA context) — reminder
    // may re-fire next check, which is preferable to throwing and silently
    // dropping the medicine reminder altogether.
  }
}

async function fireNotification(title: string, body: string, tag: string) {
  const reg = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.ready.catch(() => null)
    : null

  if (reg) {
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      requireInteraction: true,
    } as NotificationOptions)
  } else {
    new Notification(title, { body, icon: '/icons/icon-192.png', tag })
  }
}

export function checkAndFireMedicineReminders(
  medicines: MedicineForReminder[],
  takenMap: Record<string, boolean>
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  if (!medicines.length) return

  const now = new Date()
  const h   = now.getHours()
  const m   = now.getMinutes()

  for (const [timeName, { hour, emoji, greeting }] of Object.entries(MEDICINE_SCHEDULE)) {
    if (h !== hour || m >= 10) continue

    const storageKey = `reminder_${timeName}_${now.toDateString()}`
    if (readReminderFlag(storageKey)) continue

    const pending = medicines.filter(
      (med) => med.times.includes(timeName) && !takenMap[med.id]
    )

    if (pending.length === 0) continue

    const names = pending.map((med) => med.name).join(' & ')
    fireNotification(
      `${emoji} Medicine Reminder`,
      `${greeting} ${names}`,
      storageKey
    )

    writeReminderFlag(storageKey)
  }
}

export function getNextReminderLabel(medicines: MedicineForReminder[]): string | null {
  if (!medicines.length) return null
  const now = new Date()
  const h   = now.getHours()

  for (const [timeName, { hour, emoji }] of Object.entries(MEDICINE_SCHEDULE)) {
    if (hour > h) {
      const count = medicines.filter((m) => m.times.includes(timeName)).length
      if (count > 0) {
        const timeStr = hour < 12 ? `${hour}:00 AM` : `${hour - 12 || 12}:00 PM`
        return `${emoji} Next: ${timeName} at ${timeStr} (${count} medicine${count > 1 ? 's' : ''})`
      }
    }
  }
  return null
}
