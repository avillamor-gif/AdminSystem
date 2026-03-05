'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TimeAttendancePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/time-attendance/work-schedules')
  }, [router])
  
  return null
}
