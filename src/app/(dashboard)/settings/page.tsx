'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '@/components/ui'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Update your organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Organization Name" placeholder="Acme Inc." defaultValue="My Company" />
          <Input label="Email" type="email" placeholder="admin@company.com" />
          <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
          <CardDescription>Configure leave types and policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Annual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave'].map((type) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{type}</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4">Add Leave Type</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>Set default working hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" defaultValue="09:00" />
            <Input label="End Time" type="time" defaultValue="17:00" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  )
}
