import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Regulatory Compliance',   href: '/admin/compliance-audit/regulatory-compliance',   requiresPermission: 'admin.compliance.regulatory_compliance' },
  { label: 'Audit Trails',            href: '/admin/compliance-audit/audit-trails',             requiresPermission: 'admin.compliance.audit_trails' },
  { label: 'Data Retention Policies', href: '/admin/compliance-audit/data-retention-policies',  requiresPermission: 'admin.compliance.data_retention_policies' },
  { label: 'Privacy Settings',        href: '/admin/compliance-audit/privacy-settings',         requiresPermission: 'admin.compliance.privacy_settings' },
  { label: 'GDPR Compliance',         href: '/admin/compliance-audit/gdpr-compliance',           requiresPermission: 'admin.compliance.gdpr_compliance' },
  { label: 'Labor Law Compliance',    href: '/admin/compliance-audit/labor-law-compliance',      requiresPermission: 'admin.compliance.labor_law_compliance' },
]

export default function ComplianceAuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
