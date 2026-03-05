'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TravelPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/travel/travel-requests')
  }, [router])
  
  return null
}
