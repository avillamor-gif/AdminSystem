'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizationStructurePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/organization-structure/company-structure')
  }, [router])
  return null
}
