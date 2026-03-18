import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Employee Profiles',        href: '/admin/employee-data/employee-profiles',      requiresPermission: 'admin.employee_data.employee_profiles' },
  { label: 'Data Management',          href: '/admin/employee-data/data-management',         requiresPermission: 'admin.employee_data.data_management' },
  { label: 'PIM Configuration',        href: '/admin/employee-data/pim-configuration',       requiresPermission: 'admin.employee_data.pim_configuration' },
  { label: 'Reporting Fields',         href: '/admin/employee-data/reporting-fields',         requiresPermission: 'admin.employee_data.reporting_fields' },
  { label: 'Data Import/Export',       href: '/admin/employee-data/data-import-export',      requiresPermission: 'admin.employee_data.data_import_export' },
  { label: 'Employee Records',         href: '/admin/employee-data/employee-records',         requiresPermission: 'admin.employee_data.employee_records' },
  { label: 'Termination & Activation', href: '/admin/employee-data/termination-activation',  requiresPermission: 'admin.employee_data.termination_activation' },
]

export default function EmployeeDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
