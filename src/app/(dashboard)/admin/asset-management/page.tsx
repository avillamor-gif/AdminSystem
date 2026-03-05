'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AssetManagementPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/asset-management/assets')
  }, [router])
  
  return null
}
