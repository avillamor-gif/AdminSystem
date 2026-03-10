'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JobManagementPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/job-management/job-titles')
  }, [router])
  return null
}
