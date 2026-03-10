import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Company Structure',       href: '/admin/organization-structure/company-structure' },
  { label: 'Locations Management',    href: '/admin/organization-structure/locations-management' },
  { label: 'Location Types',          href: '/admin/organization-structure/location-types' },
  { label: 'Department Hierarchy',    href: '/admin/organization-structure/department-hierarchy' },
  { label: 'International Operations',href: '/admin/organization-structure/international-operations' },
  { label: 'Organizational Chart',    href: '/admin/organization-structure/organizational-chart' },
]

export default function OrganizationStructureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
