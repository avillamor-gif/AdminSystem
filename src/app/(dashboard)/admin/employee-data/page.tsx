'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeDataPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/employee-data/employee-profiles')
  }, [router])
  return null
}
