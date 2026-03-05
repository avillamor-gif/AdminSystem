'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ComplianceAuditPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/compliance-audit/regulatory-compliance')
  }, [router])
  
  return null
}
