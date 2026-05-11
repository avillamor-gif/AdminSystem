'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Approval Workflows has been consolidated into the centralized
 * Workflow & Notification Settings page.
 * This page redirects automatically so any bookmarked links keep working.
 */
export default function ApprovalWorkflowsRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/system-config/workflow-settings')
  }, [router])
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      Redirecting to Workflow &amp; Notification Settings…
    </div>
  )
}
