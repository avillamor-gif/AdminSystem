import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Regulatory Compliance',  href: '/admin/compliance-audit/regulatory-compliance' },
  { label: 'Audit Trails',           href: '/admin/compliance-audit/audit-trails' },
  { label: 'Data Retention Policies',href: '/admin/compliance-audit/data-retention-policies' },
  { label: 'Privacy Settings',       href: '/admin/compliance-audit/privacy-settings' },
  { label: 'GDPR Compliance',        href: '/admin/compliance-audit/gdpr-compliance' },
  { label: 'Labor Law Compliance',   href: '/admin/compliance-audit/labor-law-compliance' },
]

export default function ComplianceAuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
