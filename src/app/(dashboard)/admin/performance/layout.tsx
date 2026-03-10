import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Review Cycles',     href: '/admin/performance/review-cycles' },
  { label: 'Rating Scales',     href: '/admin/performance/rating-scales' },
  { label: 'Goal Templates',    href: '/admin/performance/goal-templates' },
  { label: 'Competency Models', href: '/admin/performance/competency-models' },
  { label: 'KPI Frameworks',    href: '/admin/performance/kpi-frameworks' },
  { label: '360 Feedback',      href: '/admin/performance/360-feedback' },
]

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
