'use client'

import { useState, useMemo } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui'
import { useCurrentEmployee, useEmployees } from '@/hooks/useEmployees'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'

type CalendarView = 'WEEK' | 'DAY' | 'MONTH' | 'AGENDA'

const VIEW_LABELS: Record<CalendarView, string> = {
  WEEK: 'Week',
  DAY: 'Day',
  MONTH: 'Month',
  AGENDA: 'Agenda',
}

// Build Google Calendar embed src URL for a given email
function buildEmbedUrl(email: string, view: CalendarView, timezone: string): string {
  const params = new URLSearchParams({
    src: email,
    ctz: timezone,
    mode: view,
    showTitle: '0',
    showNav: '1',
    showPrint: '0',
    showTabs: '0',
    showCalendars: '0',
    showTz: '0',
    bgcolor: '%23ffffff',
  })
  return `https://calendar.google.com/calendar/embed?${params.toString()}`
}

// Roles that can view any employee's calendar
const ELEVATED_ROLES = ['admin', 'hr', 'manager', 'ed', 'super admin']

export function MyScheduleCard() {
  const [view, setView] = useState<CalendarView>('WEEK')
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: currentEmployee } = useCurrentEmployee()
  const { data: roleInfo } = useCurrentUserPermissions()

  // Determine if the user can pick another employee's calendar
  const isElevated = useMemo(() => {
    if (!roleInfo) return false
    return ELEVATED_ROLES.includes(roleInfo.role_name.toLowerCase())
  }, [roleInfo])

  // Only fetch all employees for elevated roles
  const { data: allEmployees = [] } = useEmployees(isElevated ? {} : undefined)

  // Timezone from browser
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Resolve which employee's calendar to show
  const targetEmployee = useMemo(() => {
    if (isElevated && selectedEmployeeId) {
      return allEmployees.find(e => e.id === selectedEmployeeId) ?? currentEmployee
    }
    return currentEmployee
  }, [isElevated, selectedEmployeeId, allEmployees, currentEmployee])

  const targetEmail = targetEmployee?.email ?? ''
  const embedUrl = targetEmail ? buildEmbedUrl(targetEmail, view, timezone) : null

  return (
    <Card className="bg-white border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange" />
          <h3 className="text-sm font-semibold text-gray-700">My Schedule</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Employee picker — only for elevated roles */}
          {isElevated && (
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent bg-white max-w-[180px]"
            >
              <option value="">My Calendar</option>
              {allEmployees
                .filter(e => e.id !== currentEmployee?.id)
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                  </option>
                ))}
            </select>
          )}

          {/* View switcher */}
          <div className="relative">
            <button
              onClick={() => setShowViewMenu(v => !v)}
              className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {VIEW_LABELS[view]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showViewMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[90px]">
                  {(Object.keys(VIEW_LABELS) as CalendarView[]).map(v => (
                    <button
                      key={v}
                      onClick={() => { setView(v); setShowViewMenu(false) }}
                      className={`block w-full text-left px-3 py-2 text-xs transition-colors ${
                        view === v
                          ? 'bg-orange/10 text-orange font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {VIEW_LABELS[v]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Viewing badge for elevated roles looking at another employee */}
      {isElevated && selectedEmployeeId && targetEmployee && (
        <div className="mb-3 px-3 py-1.5 bg-orange/5 border border-orange/20 rounded-lg flex items-center justify-between">
          <span className="text-xs text-orange font-medium">
            Viewing: {targetEmployee.first_name} {targetEmployee.last_name}
          </span>
          <button
            onClick={() => setSelectedEmployeeId('')}
            className="text-xs text-orange/70 hover:text-orange underline"
          >
            Back to mine
          </button>
        </div>
      )}

      {/* Calendar embed */}
      {!targetEmail ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
          <Calendar className="w-10 h-10 text-gray-300" />
          <p className="text-sm">No Google Workspace email found</p>
          <p className="text-xs text-center text-gray-400 max-w-xs">
            Make sure your employee profile has a Google Workspace email address set.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <iframe
            src={embedUrl!}
            className="w-full"
            style={{ height: '520px', border: 'none' }}
            title={`Google Calendar — ${targetEmployee?.first_name ?? 'My'} Schedule`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}

      {/* Footer note */}
      <p className="mt-2 text-xs text-gray-400 text-center">
        Powered by Google Calendar · Events reflect the employee&apos;s Google Workspace account
      </p>
    </Card>
  )
}
