import SecondaryNav from '@/components/layout/SecondaryNav'

const publicationNavItems = [
  { label: 'Publication Management', href: '/admin/publications/publication-management' },
  { label: 'Add Publication', href: '/admin/publications/add-publication' },
  { label: 'Printing Presses', href: '/admin/publications/printing-presses' },
  { label: 'Distribution Lists', href: '/admin/publications/distribution-lists' },
  { label: 'Reports', href: '/admin/publications/reports' },
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
