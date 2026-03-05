import { EmployeeDetailContent } from '@/app/(dashboard)/employees/[id]/components/EmployeeDetailContent'

export default function AdminEmployeeDetailPage() {
  return (
    <EmployeeDetailContent backHref="/admin/employee-data/employee-profiles" />
  )
}
