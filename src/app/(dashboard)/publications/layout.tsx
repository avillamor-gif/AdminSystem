import SecondaryNav from '@/components/layout/SecondaryNav'

const publicationsNavItems = [
  { label: 'Publication Library', href: '/publications/library' },
  { label: 'Request Publication', href: '/publications/request' },
  { label: 'My Requests', href: '/publications/my-requests' },
]

export default function PublicationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-m-6">
      <SecondaryNav items={publicationsNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
