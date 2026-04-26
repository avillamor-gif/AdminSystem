'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeDataPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/employee-data/workforce-analytics')
  }, [router])
  return null
}
