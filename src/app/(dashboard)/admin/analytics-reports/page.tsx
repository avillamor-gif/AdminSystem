'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsReportsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/analytics-reports/standard-reports')
  }, [router])
  return null
}
