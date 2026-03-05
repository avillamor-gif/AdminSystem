'use client'

import { Card } from '@/components/ui'

export default function AuditTrailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Trails</h1>
        <p className="text-gray-600 mt-1">
          View system audit logs and trails
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Audit Trails configuration coming soon...</p>
      </Card>
    </div>
  )
}
