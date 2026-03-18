import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Job Postings',           href: '/admin/recruitment/job-postings',           requiresPermission: 'admin.recruitment.job_postings' },
  { label: 'Candidate Management',   href: '/admin/recruitment/candidate-management',   requiresPermission: 'admin.recruitment.candidate_management' },
  { label: 'Application Tracking',   href: '/admin/recruitment/application-tracking',   requiresPermission: 'admin.recruitment.application_tracking' },
  { label: 'Interview Scheduling',   href: '/admin/recruitment/interview-scheduling',   requiresPermission: 'admin.recruitment.interview_scheduling' },
  { label: 'Candidate Pipeline',     href: '/admin/recruitment/candidate-pipeline',     requiresPermission: 'admin.recruitment.candidate_pipeline' },
  { label: 'Hiring Workflows',       href: '/admin/recruitment/hiring-workflows',       requiresPermission: 'admin.recruitment.hiring_workflows' },
  { label: 'Offer Management',       href: '/admin/recruitment/offer-management',       requiresPermission: 'admin.recruitment.offer_management' },
  { label: 'Onboarding Process',     href: '/admin/recruitment/onboarding-process',     requiresPermission: 'admin.recruitment.onboarding_process' },
  { label: 'Recruitment Analytics',  href: '/admin/recruitment/recruitment-analytics',  requiresPermission: 'admin.recruitment.recruitment_analytics' },
  { label: 'Job Boards Integration', href: '/admin/recruitment/job-boards-integration', requiresPermission: 'admin.recruitment.job_boards_integration' },
  { label: 'Talent Pool',            href: '/admin/recruitment/talent-pool',            requiresPermission: 'admin.recruitment.talent_pool' },
  { label: 'Screening Questions',    href: '/admin/recruitment/screening-questions',    requiresPermission: 'admin.recruitment.screening_questions' },
]

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
