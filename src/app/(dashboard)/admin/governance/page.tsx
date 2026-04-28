'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GovernancePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/governance/board') }, [router])
  return null
}
