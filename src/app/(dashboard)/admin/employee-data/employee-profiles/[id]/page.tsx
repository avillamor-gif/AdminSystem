import { EmployeeDetailContent } from '@/app/(dashboard)/employees/[id]/page'

export default function AdminEmployeeDetailPage() {
  return (
    <EmployeeDetailContent backHref="/admin/employee-data/employee-profiles" />
  )
}
