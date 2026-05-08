import SecondaryNav from '@/components/layout/SecondaryNav'

const publicationNavItems = [
  { label: 'Publication Management', href: '/admin/publications/publication-management', requiresPermission: 'admin.publications.publication_management' },
  { label: 'Add Publication',        href: '/admin/publications/add-publication',        requiresPermission: 'admin.publications.add_publication' },
  { label: 'Print Job Requests',     href: '/admin/publications/print-jobs',             requiresPermission: 'admin.publications.print_jobs' },
  { label: 'Reports',                href: '/admin/publications/reports',                requiresPermission: 'admin.publications.reports' },
  { label: 'Setup',                  href: '/admin/publications/setup',                  requiresPermission: 'admin.publications.setup' },
]

export default function AdminPublicationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-m-6">
      <SecondaryNav items={publicationNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
