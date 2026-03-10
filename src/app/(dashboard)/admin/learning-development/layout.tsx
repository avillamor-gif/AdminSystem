import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Training Programs',  href: '/admin/learning-development/training-programs' },
  { label: 'Certifications',     href: '/admin/learning-development/certifications' },
  { label: 'Skills Matrix',      href: '/admin/learning-development/skills-matrix' },
  { label: 'Learning Paths',     href: '/admin/learning-development/learning-paths' },
  { label: 'External Training',  href: '/admin/learning-development/external-training' },
  { label: 'Compliance Training',href: '/admin/learning-development/compliance-training' },
]

export default function LearningDevelopmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
