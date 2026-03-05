'use client'

import { useRouter } from 'next/navigation'
import { Plane, FileText, DollarSign, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui'

export default function TravelPage() {
  const router = useRouter()

  const travelModules = [
    {
      id: 'travel-requests',
      title: 'Travel Requests',
      description: 'Submit and manage business travel requests',
      icon: Plane,
      color: 'bg-blue-500',
      href: '/admin/travel/travel-requests'
    },
    {
      id: 'travel-booking',
      title: 'Travel Booking',
      description: 'Book flights, hotels, and transportation',
      icon: FileText,
      color: 'bg-green-500',
      href: '/admin/travel/travel-booking'
    },
    {
      id: 'expense-management',
      title: 'Expense Management',
      description: 'Submit and track travel expenses',
      icon: DollarSign,
      color: 'bg-orange',
      href: '/admin/travel/expense-management'
    },
    {
      id: 'travel-analytics',
      title: 'Travel Analytics',
      description: 'View travel statistics and reports',
      icon: BarChart3,
      color: 'bg-purple-500',
      href: '/admin/travel/travel-analytics'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Travel Management</h1>
        <p className="text-gray-600 mt-1">
          Manage business travel requests, bookings, and expenses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {travelModules.map((module) => {
          const Icon = module.icon
          return (
            <Card
              key={module.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(module.href)}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${module.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
