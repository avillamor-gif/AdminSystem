'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OfficeEquipmentPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/office-equipment/equipment-inventory')
  }, [router])
  return null
}
