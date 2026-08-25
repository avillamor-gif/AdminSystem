#!/usr/bin/env node

/**
 * Recalculate all leave request total_days using proper working day counting
 * (excluding weekends and holidays)
 * 
 * Usage: node recalculate-all-leave-days.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Count working days between two dates (inclusive), excluding:
 *  - Saturdays (day 6)
 *  - Sundays  (day 0)
 *  - Any date in the holidayDates set
 */
function countWorkingDays(startDateStr, endDateStr, holidayDates = new Set()) {
  const parseLocal = (d) => {
    if (d instanceof Date) return d
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day)
  }

  const start = parseLocal(startDateStr)
  const end = parseLocal(endDateStr)

  if (end < start) return 0

  const localIso = (d) => {
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

async function main() {
  try {
    console.log('🔄 Fetching all leave requests...')
    const { data: allRequests, error: requestsError } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, total_days, employee_id, status')
      .not('status', 'in', '(cancelled,rejected)')  // Skip cancelled/rejected
      .order('created_at', { ascending: true })

    if (requestsError) throw requestsError

    console.log(`📋 Found ${allRequests.length} leave requests`)

    if (allRequests.length === 0) {
      console.log('✓ No leave requests to update')
      return
    }

    // Fetch all holidays grouped by year
    console.log('📅 Fetching all holidays...')
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('year, holiday_date')
      .eq('is_active', true)

    if (holidaysError) throw holidaysError

    // Build a map: year -> Set of holiday dates
    const holidaysByYear = new Map()
    for (const h of holidays) {
      if (!h.holiday_date) continue
      const year = new Date(h.holiday_date).getFullYear()
      if (!holidaysByYear.has(year)) {
        holidaysByYear.set(year, new Set())
      }
      holidaysByYear.get(year).add(h.holiday_date.slice(0, 10))
    }

    console.log(`📅 Loaded ${holidays.length} holidays across ${holidaysByYear.size} years`)

    // Recalculate each leave request
    let updatedCount = 0
    let changedCount = 0
    const updates = []

    for (const req of allRequests) {
      if (!req.start_date || !req.end_date) {
        console.log(`⚠️  Skipping request ${req.id} (missing dates)`)
        continue
      }

      // Get holidays for relevant years
      const startYear = new Date(req.start_date).getFullYear()
      const endYear = new Date(req.end_date).getFullYear()
      let holidayDates = new Set()

      for (let year = startYear; year <= endYear; year++) {
        const yearHolidays = holidaysByYear.get(year)
        if (yearHolidays) {
          holidayDates = new Set([...holidayDates, ...yearHolidays])
        }
      }

      // Calculate correct working days
      const correctDays = countWorkingDays(req.start_date, req.end_date, holidayDates)

      if (correctDays !== req.total_days) {
        console.log(
          `📝 Request ${req.id}: ${req.start_date} to ${req.end_date} | ` +
          `${req.total_days} days → ${correctDays} days`
        )
        updates.push({
          id: req.id,
          total_days: correctDays,
        })
        changedCount++
      }

      updatedCount++
    }

    console.log(`\n📊 Summary: ${changedCount} out of ${updatedCount} requests need updates`)

    if (updates.length === 0) {
      console.log('✓ All leave requests are already correct!')
      return
    }

    // Filter out requests with 0 days (likely dates that are all holidays/weekends)
    // These would violate CHECK constraints, especially if they're not approved/pending
    const validUpdates = updates.filter(u => {
      if (u.total_days === 0) {
        console.log(`⚠️  Skipping request ${u.id} (0 working days - likely all holidays/weekends)`)
        return false
      }
      return true
    })

    if (validUpdates.length === 0) {
      console.log('✓ No valid updates to apply (all remaining requests have 0 working days)')
      return
    }

    console.log(`\n✏️  Applying ${validUpdates.length} valid updates...`)

    // Apply updates in batches
    const batchSize = 50
    console.log(`\n💾 Updating ${validUpdates.length} records in batches of ${batchSize}...`)

    for (let i = 0; i < validUpdates.length; i += batchSize) {
      const batch = validUpdates.slice(i, i + batchSize)
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validUpdates.length / batchSize)}...`)

      for (const update of batch) {
        const { error } = await supabase
          .from('leave_requests')
          .update({ total_days: update.total_days })
          .eq('id', update.id)

        if (error) {
          console.error(`  ❌ Failed to update ${update.id}:`, error)
        }
      }
    }

    console.log(`\n✅ Successfully recalculated ${validUpdates.length} leave requests!`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
