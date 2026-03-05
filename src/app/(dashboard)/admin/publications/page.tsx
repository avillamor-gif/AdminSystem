'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPublicationsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/publications/publication-management')
  }, [router])
  return null
}
