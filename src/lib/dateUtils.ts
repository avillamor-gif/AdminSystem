/**
 * Count working days between two dates (inclusive), excluding:
 *  - Saturdays (day 6)
 *  - Sundays  (day 0)
 *  - Any date whose ISO string (YYYY-MM-DD) appears in the holidayDates set
 */
export function countWorkingDays(
  startDate: string | Date,
  endDate: string | Date,
  holidayDates: Set<string> = new Set()
): number {
  // Parse YYYY-MM-DD strings as LOCAL midnight to avoid UTC offset shifting
  const parseLocal = (d: string | Date): Date => {
    if (d instanceof Date) return d
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day)
  }

  const start = parseLocal(startDate)
  const end = parseLocal(endDate)

  if (end < start) return 0

  // Format a Date as YYYY-MM-DD in LOCAL time (no UTC shift)
  const localIso = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  let count = 0
  const cursor = new Date(start)

  while (cursor <= end) {
    const dow = cursor.getDay() // 0 = Sun, 6 = Sat
    const iso = localIso(cursor)

    if (dow !== 0 && dow !== 6 && !holidayDates.has(iso)) {
      count++
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}
