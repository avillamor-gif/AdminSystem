'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeavePoliciesPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/leave-management/leave-types')
  }, [router])
  return null
}
