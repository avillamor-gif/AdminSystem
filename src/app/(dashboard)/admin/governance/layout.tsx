import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Board of Trustees', href: '/admin/governance/board' },
  { label: 'Membership',        href: '/admin/governance/members' },
  { label: 'General Assemblies',href: '/admin/governance/general-assemblies' },
]

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
