import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/travel/seed-attendance
 * Called server-side when a travel request is approved.
 * Upserts one attendance_records row per calendar day of the trip
 * using the same plain-text notes format as the manual attendance entry
 * ("work-travel: Work on Travel – <destination>"), matching parseSessions()
 * in the attendance calendar. A seed marker is appended so rows can be
 * removed if the request is later cancelled or rejected.
 *
 * Body: { travelRequestId: string }
 *
 * DELETE /api/travel/seed-attendance
 * Removes only the auto-seeded rows when a request is cancelled/rejected.
 *
 * Body: { travelRequestId: string }
 */

export async function POST(req: NextRequest) {
  try {
    const { travelRequestId } = await req.json()
    if (!travelRequestId) {
      return NextResponse.json({ error: 'Missing travelRequestId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch the travel request
    const { data: tr, error: trErr } = await admin
      .from('travel_requests')
      .select('employee_id, start_date, end_date, destination, request_number')
      .eq('id', travelRequestId)
      .single()

    if (trErr || !tr) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 })
    }

    const { employee_id, start_date, end_date, destination, request_number } = tr

    if (!start_date || !end_date || !employee_id) {
      return NextResponse.json({ error: 'Travel request missing required fields' }, { status: 422 })
    }

    // Build list of dates in the travel range
    const dates: string[] = []
    const cursor = new Date(start_date)
    const last   = new Date(end_date)
    while (cursor <= last) {
      dates.push(cursor.toISOString().split('T')[0])
      cursor.setDate(cursor.getDate() + 1)
    }

    if (dates.length === 0) {
      return NextResponse.json({ seeded: 0 })
    }

    // Build upsert rows — one per day.
    // notes format mirrors the existing attendance entry (plain-text: "type: note"),
    // parsed by parseSessions() in the calendar. A JSON marker is embedded at the
    // end so we can identify and remove these rows if the request is later cancelled.
    const noteText = `work-travel: Work on Travel – ${destination ?? 'Travel'}`
    const rows = dates.map((date) => ({
      employee_id,
      date,
      status: 'present' as const,
      // Store as plain-text matching handleSaveAttendance format,
      // with a trailing seed marker that parseSessions ignores.
      notes: `${noteText} [travel_request_id:${travelRequestId}]`,
    }))

    // Upsert: if the employee already has a manual record for that day, skip it
    // (onConflict: do nothing) — we never overwrite existing records
    const { error: upsertErr, count } = await admin
      .from('attendance_records')
      .upsert(rows, {
        onConflict: 'employee_id,date',
        ignoreDuplicates: true,       // skip existing records
        count: 'exact',
      })

    if (upsertErr) {
      console.error('[seed-attendance] upsert error:', upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({ seeded: count ?? dates.length })
  } catch (err: any) {
    console.error('[seed-attendance] unexpected error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { travelRequestId } = await req.json()
    if (!travelRequestId) {
      return NextResponse.json({ error: 'Missing travelRequestId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch the travel request to get employee_id and date range
    const { data: tr, error: trErr } = await admin
      .from('travel_requests')
      .select('employee_id, start_date, end_date')
      .eq('id', travelRequestId)
      .single()

    if (trErr || !tr) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 })
    }

    const { employee_id, start_date, end_date } = tr
    if (!start_date || !end_date || !employee_id) {
      return NextResponse.json({ removed: 0 })
    }

    // Fetch attendance records in the date range for this employee
    const { data: records, error: fetchErr } = await admin
      .from('attendance_records')
      .select('id, notes')
      .eq('employee_id', employee_id)
      .gte('date', start_date)
      .lte('date', end_date)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    // Only remove rows seeded by THIS travel request (identified by the trailing marker)
    const marker = `[travel_request_id:${travelRequestId}]`
    const toDelete = (records ?? [])
      .filter((r: any) => (r.notes ?? '').includes(marker))
      .map((r: any) => r.id)

    if (toDelete.length === 0) {
      return NextResponse.json({ removed: 0 })
    }

    const { error: delErr } = await admin
      .from('attendance_records')
      .delete()
      .in('id', toDelete)

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    return NextResponse.json({ removed: toDelete.length })
  } catch (err: any) {
    console.error('[seed-attendance] delete error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
