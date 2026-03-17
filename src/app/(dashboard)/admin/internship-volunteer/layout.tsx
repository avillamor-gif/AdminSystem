import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Partner Institutions', href: '/admin/internship-volunteer/partner-institutions' },
  { label: 'Enrollments',          href: '/admin/internship-volunteer/enrollments' },
  { label: 'Hours Monitoring',     href: '/admin/internship-volunteer/hours-monitoring' },
  { label: 'Certificates',         href: '/admin/internship-volunteer/certificates' },
]

export default function InternshipVolunteerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
