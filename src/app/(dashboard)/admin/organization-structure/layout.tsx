import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Company Structure',        href: '/admin/organization-structure/company-structure',        requiresPermission: 'admin.organization.company_structure' },
  { label: 'Locations Management',     href: '/admin/organization-structure/locations-management',     requiresPermission: 'admin.organization.locations_management' },
  { label: 'Location Types',           href: '/admin/organization-structure/location-types',           requiresPermission: 'admin.organization.location_types' },
  { label: 'Department Hierarchy',     href: '/admin/organization-structure/department-hierarchy',     requiresPermission: 'admin.organization.department_hierarchy' },
  { label: 'International Operations', href: '/admin/organization-structure/international-operations', requiresPermission: 'admin.organization.international_operations' },
  { label: 'Organizational Chart',     href: '/admin/organization-structure/organizational-chart',     requiresPermission: 'admin.organization.organizational_chart' },
]

export default function OrganizationStructureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
