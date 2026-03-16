import SecondaryNav from '@/components/layout/SecondaryNav'

const leaveManagementNavItems = [
  { label: 'All Leave Requests',  href: '/admin/leave-management' },
  { label: 'Leave Credit Approvals', href: '/admin/leave-management/credit-approvals' },
  { label: 'Leave Types',         href: '/admin/leave-management/leave-types' },
  { label: 'Accrual Rules',       href: '/admin/leave-management/accrual-rules' },
  { label: 'Leave Policies',      href: '/admin/leave-management/leave-policies' },
  { label: 'Leave Balances',      href: '/admin/leave-management/leave-balances' },
  { label: 'Holiday Calendar',    href: '/admin/leave-management/holiday-calendar' },
  { label: 'Absence Categories',  href: '/admin/leave-management/absence-categories' },
  { label: 'Approval Workflows',  href: '/admin/leave-management/approval-workflows' },
]

export default function LeaveManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={leaveManagementNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
