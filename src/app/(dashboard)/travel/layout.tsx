import SecondaryNav from '@/components/layout/SecondaryNav'

const travelNavItems = [
  { label: 'Travel Request', href: '/travel/travel-request' },
  { label: 'My Requests', href: '/travel/my-requests' },
]

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={travelNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
