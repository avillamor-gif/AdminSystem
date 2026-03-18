import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Review Cycles',     href: '/admin/performance/review-cycles',      requiresPermission: 'admin.performance.review_cycles' },
  { label: 'Rating Scales',     href: '/admin/performance/rating-scales',      requiresPermission: 'admin.performance.rating_scales' },
  { label: 'Goal Templates',    href: '/admin/performance/goal-templates',     requiresPermission: 'admin.performance.goal_templates' },
  { label: 'Competency Models', href: '/admin/performance/competency-models',  requiresPermission: 'admin.performance.competency_models' },
  { label: 'KPI Frameworks',    href: '/admin/performance/kpi-frameworks',     requiresPermission: 'admin.performance.kpi_frameworks' },
  { label: '360 Feedback',      href: '/admin/performance/360-feedback',       requiresPermission: 'admin.performance.360_feedback' },
]

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
