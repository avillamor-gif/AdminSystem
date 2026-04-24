/**
 * Google Calendar API route.
 *
 * POST /api/google/calendar
 * Body:
 *   action: 'create' | 'delete'
 *   userEmail: string          — Workspace email of the calendar owner
 *   event?: {
 *     summary: string
 *     description?: string
 *     start: string            — ISO date or datetime (e.g. "2026-05-01" or "2026-05-01T09:00:00")
 *     end: string
 *     allDay?: boolean         — if true, uses date not dateTime
 *     attendees?: string[]     — additional attendee emails
 *   }
 *   eventId?: string           — required for action='delete'
 *
 * Returns: { success: true, eventId?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCalendarClient } from '@/lib/google'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userEmail, event, eventId } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    const calendar = getCalendarClient(userEmail)

    if (action === 'create') {
      if (!event) {
        return NextResponse.json({ error: 'event is required for create' }, { status: 400 })
      }

      const isAllDay = event.allDay === true

      const calEvent = {
        summary: event.summary,
        description: event.description ?? '',
        start: isAllDay
          ? { date: event.start.split('T')[0] }
          : { dateTime: event.start, timeZone: 'Asia/Manila' },
        end: isAllDay
          ? { date: event.end.split('T')[0] }
          : { dateTime: event.end, timeZone: 'Asia/Manila' },
        attendees: event.attendees
          ? event.attendees.map((email: string) => ({ email }))
          : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      }

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: calEvent,
        sendUpdates: 'all',
      })

      return NextResponse.json({ success: true, eventId: res.data.id })
    }

    if (action === 'delete') {
      if (!eventId) {
        return NextResponse.json({ error: 'eventId is required for delete' }, { status: 400 })
      }

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Google Calendar API]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
