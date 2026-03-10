'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SystemConfigPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/system-config/general-settings')
  }, [router])
  return null
}
