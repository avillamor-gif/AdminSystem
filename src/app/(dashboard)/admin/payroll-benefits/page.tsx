'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PayrollBenefitsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/payroll-benefits/pay-components')
  }, [router])
  
  return null
}
