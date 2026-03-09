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
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Normalise to midnight local time so date comparisons are reliable
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (end < start) return 0

  let count = 0
  const cursor = new Date(start)

  while (cursor <= end) {
    const day = cursor.getDay() // 0 = Sun, 6 = Sat
    const iso = cursor.toISOString().slice(0, 10) // YYYY-MM-DD

    if (day !== 0 && day !== 6 && !holidayDates.has(iso)) {
      count++
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}
