'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MERoot() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/monitoring-evaluation/dashboard') }, [router])
  return null
}
