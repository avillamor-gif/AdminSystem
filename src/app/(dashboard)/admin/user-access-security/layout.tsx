import SecondaryNav from '@/components/layout/SecondaryNav'

const securityNavItems = [
  { label: 'User Management',          href: '/admin/user-access-security/user-management',   requiresPermission: 'admin.user_access.user_management' },
  { label: 'Create Login Account',     href: '/admin/user-access-security/create-account',    requiresPermission: 'admin.user_access.user_management' },
  { label: 'Role-Based Access Control',href: '/admin/user-access-security/rbac',              requiresPermission: 'admin.user_access.rbac' },
  { label: 'Security Policies',        href: '/admin/user-access-security/security-policies',  requiresPermission: 'admin.user_access.security_policies' },
  { label: 'Session Management',       href: '/admin/user-access-security/session-management', requiresPermission: 'admin.user_access.session_management' },
  { label: 'Two-Factor Authentication',href: '/admin/user-access-security/two-factor',         requiresPermission: 'admin.user_access.two_factor' },
  { label: 'Password Policies',        href: '/admin/user-access-security/password-policies',  requiresPermission: 'admin.user_access.password_policies' },
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
