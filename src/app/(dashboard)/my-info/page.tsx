'use client'

import { useCurrentEmployee } from '@/hooks/useEmployees'
import { EmployeeDetailContent } from '@/app/(dashboard)/employees/[id]/components/EmployeeDetailContent'

export default function MyInfoPage() {
  const { data: currentEmployee, isLoading } = useCurrentEmployee()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
      </div>
    )
  }

  if (!currentEmployee?.employee_id) {
    return (
      <div className="text-center py-12 text-gray-500">
        No employee profile found for your account. Please contact HR.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Info</h1>
        <p className="text-gray-600 mt-1">View and update your personal information</p>
      </div>

      <EmployeeDetailContent
        overrideEmployeeId={currentEmployee.employee_id}
        hideBackButton
        readOnly
      />
    </div>
  )
}

