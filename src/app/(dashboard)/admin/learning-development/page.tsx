'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LearningDevelopmentPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/learning-development/training-programs')
  }, [router])
  
  return null
}
