import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Job Titles',        href: '/admin/job-management/job-titles' },
  { label: 'Job Descriptions',  href: '/admin/job-management/job-descriptions' },
  { label: 'Pay Grades',        href: '/admin/job-management/pay-grades' },
  { label: 'Salary Structures', href: '/admin/job-management/salary-structures' },
  { label: 'Employment Types',  href: '/admin/job-management/employment-types' },
  { label: 'Job Categories',    href: '/admin/job-management/job-categories' },
  { label: 'Career Paths',      href: '/admin/job-management/career-paths' },
]

export default function JobManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
