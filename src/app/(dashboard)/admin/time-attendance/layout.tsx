import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Work Schedules',        href: '/admin/time-attendance/work-schedules',        requiresPermission: 'admin.time_attendance.work_schedules' },
  { label: 'Shift Patterns',        href: '/admin/time-attendance/shift-patterns',        requiresPermission: 'admin.time_attendance.shift_patterns' },
  { label: 'Overtime Rules',        href: '/admin/time-attendance/overtime-rules',        requiresPermission: 'admin.time_attendance.overtime_rules' },
  { label: 'Break Policies',        href: '/admin/time-attendance/break-policies',        requiresPermission: 'admin.time_attendance.break_policies' },
  { label: 'Time Tracking Methods', href: '/admin/time-attendance/time-tracking-methods', requiresPermission: 'admin.time_attendance.time_tracking_methods' },
  { label: 'Attendance Policies',   href: '/admin/time-attendance/attendance-policies',   requiresPermission: 'admin.time_attendance.attendance_policies' },
  { label: 'Attendance Reports',    href: '/admin/time-attendance/reports',               requiresPermission: 'admin.time_attendance.reports' },
  { label: 'OT / OB Requests',      href: '/admin/time-attendance/ot-ob-requests',         requiresPermission: 'admin.time_attendance.overtime_rules' },
]

export default function TimeAttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
