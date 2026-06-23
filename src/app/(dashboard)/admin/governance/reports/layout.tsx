import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Membership Analytics', href: '/admin/governance/reports/membership-analytics' },
  { label: 'Email Report',         href: '/admin/governance/reports/email-report' },
]

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6">
      <SecondaryNav items={navItems} />
      <div className="px-6 pt-6">{children}</div>
    </div>
  )
}
