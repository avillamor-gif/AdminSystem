import SecondaryNav from '@/components/layout/SecondaryNav'

const securityNavItems = [
  { label: 'User Management', href: '/admin/user-access-security/user-management' },
  { label: 'Role-Based Access Control', href: '/admin/user-access-security/rbac' },
  { label: 'Security Policies', href: '/admin/user-access-security/security-policies' },
  { label: 'Session Management', href: '/admin/user-access-security/session-management' },
  { label: 'Two-Factor Authentication', href: '/admin/user-access-security/two-factor' },
  { label: 'Password Policies', href: '/admin/user-access-security/password-policies' },
]

export default function UserAccessSecurityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-m-6">
      <SecondaryNav 
        items={securityNavItems}
      />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
