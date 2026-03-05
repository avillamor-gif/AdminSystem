'use client'

import { Card } from '@/components/ui'

export default function SystemMaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Maintenance</h1>
        <p className="text-gray-600 mt-1">
          System maintenance and updates
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">System Maintenance configuration coming soon...</p>
      </Card>
    </div>
  )
}
