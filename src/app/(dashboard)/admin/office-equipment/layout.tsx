import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Equipment Inventory', href: '/admin/office-equipment/equipment-inventory' },
  { label: 'Equipment Requests',  href: '/admin/office-equipment/equipment-requests' },
  { label: 'Equipment Assignment',href: '/admin/office-equipment/equipment-assignment' },
  { label: 'Maintenance Records', href: '/admin/office-equipment/maintenance-records' },
  { label: 'Warranty Tracking',   href: '/admin/office-equipment/warranty-tracking' },
]

export default function OfficeEquipmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
