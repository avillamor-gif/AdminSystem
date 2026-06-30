import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Appraisal Management', href: '/admin/performance/appraisals', requiresPermission: 'admin.performance.view' },
  { label: 'Probationary Reviews', href: '/admin/performance/probationary-reviews', requiresPermission: 'admin.performance.probationary_reviews' },
]

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
