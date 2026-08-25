import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Equipment Requests',  href: '/admin/office-equipment/equipment-requests' },
  { label: 'Borrowed Equipment',  href: '/admin/office-equipment/borrowed-equipment' },
  { label: 'Send Form Link',      href: '/admin/office-equipment/send-form-link' },
  { label: 'Analytics',           href: '/admin/office-equipment/analytics' },
]

export default function OfficeEquipmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
