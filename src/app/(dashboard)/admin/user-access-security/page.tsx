'use client'

import { useRouter } from 'next/navigation'

export default function UserAccessSecurityPage() {
  const router = useRouter()
  
  // Redirect to user management as the default page
  router.push('/admin/user-access-security/user-management')
  
  return null
}
