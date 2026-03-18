import SecondaryNav from '@/components/layout/SecondaryNav'

const leaveManagementNavItems = [
  { label: 'All Leave Requests',     href: '/admin/leave-management',                       requiresPermission: 'admin.leave_management.leave_requests' },
  { label: 'Leave Credit Approvals', href: '/admin/leave-management/credit-approvals',      requiresPermission: 'admin.leave_management.credit_approvals' },
  { label: 'Leave Types',            href: '/admin/leave-management/leave-types',           requiresPermission: 'admin.leave_management.leave_types' },
  { label: 'Accrual Rules',          href: '/admin/leave-management/accrual-rules',         requiresPermission: 'admin.leave_management.accrual_rules' },
  { label: 'Leave Policies',         href: '/admin/leave-management/leave-policies',        requiresPermission: 'admin.leave_management.leave_policies' },
  { label: 'Leave Balances',         href: '/admin/leave-management/leave-balances',        requiresPermission: 'admin.leave_management.leave_balances' },
  { label: 'Holiday Calendar',       href: '/admin/leave-management/holiday-calendar',      requiresPermission: 'admin.leave_management.holiday_calendar' },
  { label: 'Absence Categories',     href: '/admin/leave-management/absence-categories',    requiresPermission: 'admin.leave_management.absence_categories' },
  { label: 'Approval Workflows',     href: '/admin/leave-management/approval-workflows',    requiresPermission: 'admin.leave_management.approval_workflows' },
]

export default function LeaveManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={leaveManagementNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
