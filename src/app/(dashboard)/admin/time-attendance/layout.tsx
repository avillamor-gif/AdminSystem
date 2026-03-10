import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Work Schedules',        href: '/admin/time-attendance/work-schedules' },
  { label: 'Shift Patterns',        href: '/admin/time-attendance/shift-patterns' },
  { label: 'Overtime Rules',        href: '/admin/time-attendance/overtime-rules' },
  { label: 'Break Policies',        href: '/admin/time-attendance/break-policies' },
  { label: 'Time Tracking Methods', href: '/admin/time-attendance/time-tracking-methods' },
  { label: 'Attendance Policies',   href: '/admin/time-attendance/attendance-policies' },
  { label: 'Attendance Reports',    href: '/admin/time-attendance/reports' },
]

export default function TimeAttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
