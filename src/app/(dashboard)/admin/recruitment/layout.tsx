import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Job Postings',          href: '/admin/recruitment/job-postings' },
  { label: 'Candidate Management',  href: '/admin/recruitment/candidate-management' },
  { label: 'Application Tracking',  href: '/admin/recruitment/application-tracking' },
  { label: 'Interview Scheduling',  href: '/admin/recruitment/interview-scheduling' },
  { label: 'Candidate Pipeline',    href: '/admin/recruitment/candidate-pipeline' },
  { label: 'Hiring Workflows',      href: '/admin/recruitment/hiring-workflows' },
  { label: 'Offer Management',      href: '/admin/recruitment/offer-management' },
  { label: 'Onboarding Process',    href: '/admin/recruitment/onboarding-process' },
  { label: 'Recruitment Analytics', href: '/admin/recruitment/recruitment-analytics' },
  { label: 'Job Boards Integration',href: '/admin/recruitment/job-boards-integration' },
  { label: 'Talent Pool',           href: '/admin/recruitment/talent-pool' },
  { label: 'Screening Questions',   href: '/admin/recruitment/screening-questions' },
]

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
