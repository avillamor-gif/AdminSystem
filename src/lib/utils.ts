import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns today's date as a YYYY-MM-DD string in the browser's LOCAL timezone.
 * Use this instead of new Date().toISOString().split('T')[0], which returns
 * the UTC date and will be wrong for timezones ahead of UTC (e.g. Africa/Nairobi
 * UTC+3 will show yesterday's date after midnight local time).
 */
export function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
  }).format(new Date(date))
}

export function getInitials(firstName: string, lastName: string) {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return `${first}${last}`.toUpperCase()
}

export function generateEmployeeId(hireDate?: string | Date, prefix = 'EMP') {
  if (hireDate) {
    const date = new Date(hireDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }
  
  // Fallback to timestamp-based ID if no hire date provided
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}
