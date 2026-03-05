import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
