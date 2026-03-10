import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Employee Profiles',    href: '/admin/employee-data/employee-profiles' },
  { label: 'Data Management',      href: '/admin/employee-data/data-management' },
  { label: 'PIM Configuration',    href: '/admin/employee-data/pim-configuration' },
  { label: 'Reporting Fields',     href: '/admin/employee-data/reporting-fields' },
  { label: 'Data Import/Export',   href: '/admin/employee-data/data-import-export' },
  { label: 'Employee Records',     href: '/admin/employee-data/employee-records' },
  { label: 'Termination & Activation', href: '/admin/employee-data/termination-activation' },
]

export default function EmployeeDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
