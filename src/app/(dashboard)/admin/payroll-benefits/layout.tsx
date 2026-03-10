import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Pay Components',   href: '/admin/payroll-benefits/pay-components' },
  { label: 'Tax Configuration',href: '/admin/payroll-benefits/tax-configuration' },
  { label: 'Benefits Plans',   href: '/admin/payroll-benefits/benefits-plans' },
  { label: 'Deductions',       href: '/admin/payroll-benefits/deductions' },
  { label: 'Bonus Structures', href: '/admin/payroll-benefits/bonus-structures' },
  { label: 'Reimbursements',   href: '/admin/payroll-benefits/reimbursements' },
]

export default function PayrollBenefitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
