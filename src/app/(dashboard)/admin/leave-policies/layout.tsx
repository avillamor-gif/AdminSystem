import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Leave Types',        href: '/admin/leave-policies/leave-types' },
  { label: 'Accrual Rules',      href: '/admin/leave-policies/accrual-rules' },
  { label: 'Leave Policies',     href: '/admin/leave-policies/leave-policies' },
  { label: 'Leave Balances',     href: '/admin/leave-policies/leave-balances' },
  { label: 'Holiday Calendar',   href: '/admin/leave-policies/holiday-calendar' },
  { label: 'Absence Categories', href: '/admin/leave-policies/absence-categories' },
  { label: 'Approval Workflows', href: '/admin/leave-policies/approval-workflows' },
]

export default function LeavePoliciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
