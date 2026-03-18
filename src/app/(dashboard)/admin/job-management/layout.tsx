import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Job Titles',        href: '/admin/job-management/job-titles',        requiresPermission: 'admin.job_management.job_titles' },
  { label: 'Job Descriptions',  href: '/admin/job-management/job-descriptions',  requiresPermission: 'admin.job_management.job_descriptions' },
  { label: 'Pay Grades',        href: '/admin/job-management/pay-grades',        requiresPermission: 'admin.job_management.pay_grades' },
  { label: 'Salary Structures', href: '/admin/job-management/salary-structures', requiresPermission: 'admin.job_management.salary_structures' },
  { label: 'Employment Types',  href: '/admin/job-management/employment-types',  requiresPermission: 'admin.job_management.employment_types' },
  { label: 'Job Categories',    href: '/admin/job-management/job-categories',    requiresPermission: 'admin.job_management.job_categories' },
  { label: 'Career Paths',      href: '/admin/job-management/career-paths',      requiresPermission: 'admin.job_management.career_paths' },
]

export default function JobManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
