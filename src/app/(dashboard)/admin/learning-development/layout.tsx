import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Training Programs',   href: '/admin/learning-development/training-programs',   requiresPermission: 'admin.learning.training_programs' },
  { label: 'Certifications',      href: '/admin/learning-development/certifications',       requiresPermission: 'admin.learning.certifications' },
  { label: 'Skills Matrix',       href: '/admin/learning-development/skills-matrix',        requiresPermission: 'admin.learning.skills_matrix' },
  { label: 'Learning Paths',      href: '/admin/learning-development/learning-paths',       requiresPermission: 'admin.learning.learning_paths' },
  { label: 'External Training',   href: '/admin/learning-development/external-training',    requiresPermission: 'admin.learning.external_training' },
  { label: 'Compliance Training', href: '/admin/learning-development/compliance-training',  requiresPermission: 'admin.learning.compliance_training' },
]

export default function LearningDevelopmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
