import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Payroll Runs',      href: '/admin/payroll-benefits/payroll-runs',      requiresPermission: 'admin.payroll_benefits.payroll_runs' },
  { label: 'Pay Components',    href: '/admin/payroll-benefits/pay-components',    requiresPermission: 'admin.payroll_benefits.pay_components' },
  { label: 'Tax Configuration', href: '/admin/payroll-benefits/tax-configuration', requiresPermission: 'admin.payroll_benefits.tax_configuration' },
  { label: 'Benefits Plans',    href: '/admin/payroll-benefits/benefits-plans',    requiresPermission: 'admin.payroll_benefits.benefits_plans' },
  { label: 'Deductions',        href: '/admin/payroll-benefits/deductions',        requiresPermission: 'admin.payroll_benefits.deductions' },
  { label: 'Bonus Structures',  href: '/admin/payroll-benefits/bonus-structures',  requiresPermission: 'admin.payroll_benefits.bonus_structures' },
  { label: 'Reimbursements',    href: '/admin/payroll-benefits/reimbursements',    requiresPermission: 'admin.payroll_benefits.reimbursements' },
]

export default function PayrollBenefitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
