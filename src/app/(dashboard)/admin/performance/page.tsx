'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PerformancePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/performance/appraisals')
  }, [router])
  return null
}
