'use client'

import { useState } from 'react'
import { Users, Calendar, Clock, Briefcase, UserCheck, CalendarX, CheckCircle, FileText, ClipboardList } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal'
import { useEmployeesWorkStatusToday } from '@/hooks/useLeave'
import { useHolidays } from '@/hooks/useLeaveAbsence'
import { useRouter } from 'next/navigation'
import { localDateStr } from '@/lib/utils'
import { MyScheduleCard } from '@/components/dashboard/MyScheduleCard'
import { PunchInOutCard } from '@/components/dashboard/PunchInOutCard'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { usePendingApprovals, useTeamPendingRequests } from '@/hooks/useLeaveRequests'
import { useIsAdmin } from '@/hooks/usePermissions'

export default function DashboardPage() {
  const router = useRouter()
  const { data: workStatusList = [], isLoading: leaveLoading } = useEmployeesWorkStatusToday()
  const { data: currentEmployee } = useCurrentEmployee()
  const isAdmin = useIsAdmin()
  const employeeId = currentEmployee?.id ?? ''

  // Pending leave requests where I am an approver (my own pending approvals step)
  const { data: pendingApprovals = [] } = usePendingApprovals(employeeId)
  // Pending requests from my team (I'm the manager)
  const { data: teamPending = [] } = useTeamPendingRequests(employeeId)

  const leaveActionsCount = pendingApprovals.length + teamPending.length

  const today = localDateStr()
  const { data: allHolidays = [], isLoading: holidaysLoading } = useHolidays({ is_active: true })
  const upcomingHolidays = allHolidays
    .filter(h => h.holiday_date >= today)
    .slice(0, 5)

  const [showAllHolidays, setShowAllHolidays] = useState(false)
  const currentYear = new Date().getFullYear()
  const yearHolidays = allHolidays
    .filter(h => new Date(h.holiday_date + 'T00:00:00').getFullYear() === currentYear)
    .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Time at Work: 00:00</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Punch In/Out Widget */}
        <PunchInOutCard
          onPunchedIn={() => router.push('/attendance-tracker?tab=timesheets')}
          onPunchedOut={() => router.push('/attendance-tracker?tab=timesheets')}
        />

        {/* Quick Launch */}
        <Card className="bg-white border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Launch</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/leave" className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-orange/10 transition-colors group">
              <Calendar className="w-8 h-8 text-orange mb-2" />
              <span className="text-xs text-gray-600 group-hover:text-orange">Apply Leave</span>
            </a>
            <a href="/leave" className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-orange/10 transition-colors group">
              <Users className="w-8 h-8 text-orange mb-2" />
              <span className="text-xs text-gray-600 group-hover:text-orange">My Leave</span>
            </a>
            <a href="/attendance-tracker" className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-orange/10 transition-colors group">
              <Clock className="w-8 h-8 text-orange mb-2" />
              <span className="text-xs text-gray-600 group-hover:text-orange">My Timesheet</span>
            </a>
            <a href="/attendance-tracker" className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-orange/10 transition-colors group">
              <Briefcase className="w-8 h-8 text-orange mb-2" />
              <span className="text-xs text-gray-600 group-hover:text-orange">Attendance</span>
            </a>
          </div>
        </Card>

        {/* My Actions */}
        <Card className="bg-white border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">My Actions</h3>
            {leaveActionsCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                {leaveActionsCount}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {/* Leave approvals */}
            <button
              onClick={() => router.push('/admin/leave-management')}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-orange/5 bg-orange/5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Leave Requests</span>
                  <p className="text-xs text-gray-400">
                    {leaveActionsCount === 0 ? 'No pending approvals' : `${leaveActionsCount} awaiting your approval`}
                  </p>
                </div>
              </div>
              {leaveActionsCount > 0 ? (
                <span className="px-2 py-0.5 bg-orange text-white text-xs font-bold rounded-full">{leaveActionsCount}</span>
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </button>

            {/* Timesheets — visible to managers/admins */}
            {(isAdmin || (currentEmployee?.id)) && (
              <button
                onClick={() => router.push('/attendance-tracker?tab=approvals')}
                className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-50 bg-gray-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Timesheets to Approve</span>
                    <p className="text-xs text-gray-400">Go to attendance tracker</p>
                  </div>
                </div>
                <ClipboardList className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* View all notifications */}
            <button
              onClick={() => router.push('/leave/my-requests')}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-50 bg-gray-50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">My Leave Requests</span>
                  <p className="text-xs text-gray-400">View your submitted requests</p>
                </div>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees' Work Status Today */}
        <Card className="bg-white border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Employees' Work Status Today</h3>
            {!leaveLoading && (
              <span className="px-2 py-0.5 bg-orange/10 text-orange text-xs font-medium rounded">
                {workStatusList.length}
              </span>
            )}
          </div>
          {leaveLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-32" />
                    <div className="h-2 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : workStatusList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No status recorded for today yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[368px] overflow-y-auto pr-1">
              {workStatusList.map((item) => {
                const firstName = item.employee?.first_name ?? ''
                const lastName = item.employee?.last_name ?? ''
                const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
                const dept = item.employee?.department?.name ?? ''
                const badgeStyles: Record<string, string> = {
                  'work-home':    'bg-green-100 text-green-700',
                  'work-offsite': 'bg-purple-100 text-purple-700',
                  'work-travel':  'bg-indigo-100 text-indigo-700',
                  'work-onsite':  'bg-blue-100 text-blue-700',
                  'on-leave':     'bg-orange/10 text-orange',
                }
                const badgeCls = badgeStyles[item.statusType] ?? 'bg-gray-100 text-gray-600'
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar
                      src={item.employee?.avatar_url}
                      firstName={firstName || '?'}
                      lastName={lastName}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                      {dept && <p className="text-xs text-gray-500 truncate">{dept}</p>}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${badgeCls}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Holidays */}
        <Card className="bg-white border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Upcoming Holidays</h3>
            <button onClick={() => setShowAllHolidays(true)} className="text-orange text-xs hover:underline">View All</button>
          </div>
          {holidaysLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-28" />
                    <div className="h-2 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingHolidays.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No upcoming holidays</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => {
                const d = new Date(holiday.holiday_date + 'T00:00:00')
                const monthShort = d.toLocaleDateString('en-US', { month: 'short' })
                const day = d.getDate()
                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
                const typeLabel =
                  holiday.holiday_type === 'regular' ? 'Regular' :
                  holiday.holiday_type === 'special_non_working' ? 'Special' : 'Working'
                const typeBg =
                  holiday.holiday_type === 'regular' ? 'bg-red-50 text-red-600' :
                  holiday.holiday_type === 'special_non_working' ? 'bg-amber-50 text-amber-600' :
                  'bg-blue-50 text-blue-600'
                return (
                  <div key={holiday.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                    <div className="w-12 h-12 bg-orange/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-orange uppercase leading-none">{monthShort}</span>
                      <span className="text-lg font-bold text-orange leading-tight">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{holiday.holiday_name}</p>
                      <p className="text-xs text-gray-500">{dayName}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${typeBg}`}>
                      {typeLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* My Schedule — full width */}
      <MyScheduleCard />

      {/* All Holidays Modal */}
      <Modal open={showAllHolidays} onClose={() => setShowAllHolidays(false)} size="lg">
        <ModalHeader onClose={() => setShowAllHolidays(false)}>
          Holidays — {currentYear}
        </ModalHeader>
        <ModalBody>
          {yearHolidays.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CalendarX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No holidays found for {currentYear}</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh] space-y-2 pr-1">
              {yearHolidays.map((holiday) => {
                const d = new Date(holiday.holiday_date + 'T00:00:00')
                const monthShort = d.toLocaleDateString('en-US', { month: 'short' })
                const day = d.getDate()
                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
                const fullDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                const isPast = holiday.holiday_date < today
                const typeLabel =
                  holiday.holiday_type === 'regular' ? 'Regular' :
                  holiday.holiday_type === 'special_non_working' ? 'Special Non-Working' : 'Special Working'
                const typeBg =
                  holiday.holiday_type === 'regular' ? 'bg-red-50 text-red-600' :
                  holiday.holiday_type === 'special_non_working' ? 'bg-amber-50 text-amber-600' :
                  'bg-blue-50 text-blue-600'
                return (
                  <div
                    key={holiday.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg ${
                      isPast ? 'border-gray-100 opacity-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                      isPast ? 'bg-gray-100' : 'bg-orange/10'
                    }`}>
                      <span className={`text-xs font-medium uppercase leading-none ${
                        isPast ? 'text-gray-400' : 'text-orange'
                      }`}>{monthShort}</span>
                      <span className={`text-lg font-bold leading-tight ${
                        isPast ? 'text-gray-400' : 'text-orange'
                      }`}>{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{holiday.holiday_name}</p>
                      <p className="text-xs text-gray-500">{dayName} · {fullDate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${typeBg}`}>
                        {typeLabel}
                      </span>
                      {isPast && (
                        <span className="text-xs text-gray-400">Past</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  )
}
