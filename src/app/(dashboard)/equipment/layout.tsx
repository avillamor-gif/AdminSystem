import { redirect } from 'next/navigation'
import SecondaryNav from '@/components/layout/SecondaryNav'

const equipmentNavItems = [
  { label: 'Browse Equipment', href: '/equipment/browse' },
  { label: 'Equipment Checkout', href: '/equipment/checkout' },
  { label: 'My Requests', href: '/equipment/my-requests' },
]

export default function EquipmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-m-6">
      <SecondaryNav items={equipmentNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
