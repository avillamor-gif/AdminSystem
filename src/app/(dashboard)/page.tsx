'use client'

import { Users, Calendar, Clock, Briefcase, UserCheck, CalendarX } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { useEmployeesOnLeaveToday } from '@/hooks/useLeave'
import { useHolidays } from '@/hooks/useLeaveAbsence'

import { MyScheduleCard } from '@/components/dashboard/MyScheduleCard'

export default function DashboardPage() {
  const { data: employeesOnLeave = [], isLoading: leaveLoading } = useEmployeesOnLeaveToday()

  const today = new Date().toISOString().split('T')[0]
  const { data: allHolidays = [], isLoading: holidaysLoading } = useHolidays({ is_active: true })
  const upcomingHolidays = allHolidays
    .filter(h => h.holiday_date >= today)
    .slice(0, 5)

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
        {/* Work Status Widget */}
        <Card className="bg-white border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Work Status</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-600">Wednesday, Mar 4, 2026</p>
            <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="bg-green-100 rounded-lg p-3 mb-4 text-center">
            <p className="text-green-800 font-semibold text-sm">Work from home</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-medium mb-3">This Week (Mar 2-8)</p>
            <div className="flex items-end justify-between gap-1.5">
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-24 bg-blue-500 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Mon</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-24 bg-blue-500 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Tue</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-24 bg-green-600 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Wed</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-24 bg-blue-500 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Thu</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-24 bg-blue-500 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Fri</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-16 bg-gray-200 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Sat</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-full h-16 bg-gray-200 rounded-t"></div>
                <span className="text-xs text-gray-500 mt-1.5">Sun</span>
              </div>
            </div>
          </div>
        </Card>

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
          <h3 className="text-sm font-semibold text-gray-700 mb-4">My Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange" />
                </div>
                <span className="text-sm text-gray-700">Leave Requests</span>
              </div>
              <span className="px-2 py-0.5 bg-orange text-white text-xs font-medium rounded-full">3</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-sm text-gray-700">Timesheets to Approve</span>
              </div>
              <span className="px-2 py-0.5 bg-gray-300 text-gray-700 text-xs font-medium rounded-full">0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees on Leave Today */}
        <Card className="bg-white border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Employees on Leave Today</h3>
            {!leaveLoading && (
              <span className="px-2 py-0.5 bg-orange/10 text-orange text-xs font-medium rounded">
                {employeesOnLeave.length}
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
          ) : employeesOnLeave.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No employees on leave today</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {employeesOnLeave.map((item) => {
                const firstName = item.employee?.first_name ?? ''
                const lastName = item.employee?.last_name ?? ''
                const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
                const dept = (item.employee as any)?.department?.name ?? ''
                const leaveType = item.leave_type?.name ?? 'Leave'
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar
                      src={(item.employee as any)?.avatar_url}
                      firstName={firstName || '?'}
                      lastName={lastName}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                      {dept && <p className="text-xs text-gray-500 truncate">{dept}</p>}
                    </div>
                    <span className="px-2 py-1 bg-orange/10 text-orange text-xs font-medium rounded whitespace-nowrap">
                      {leaveType}
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
            <a href="/admin/leave-management/holidays" className="text-orange text-xs hover:underline">View All</a>
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
    </div>
  )
}
