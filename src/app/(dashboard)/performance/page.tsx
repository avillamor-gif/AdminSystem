'use client'

import { useState } from 'react'
import { Plus, Briefcase, Star, TrendingUp, FileText, ClipboardList } from 'lucide-react'
import { usePerformanceReviews, useGoals, useCurrentEmployee } from '@/hooks'
import { Card, Button, Badge, Avatar } from '@/components/ui'
import PerformanceAppraisalWorkspace from '@/components/performance/PerformanceAppraisalWorkspace'
import BackToOfficeReport from '@/components/performance/BackToOfficeReport'
import UnitReportingForm from '@/components/performance/UnitReportingForm'
import type { PerformanceReviewWithRelations, GoalWithRelations } from '@/services'

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'appraisals' | 'btor' | 'urf' | 'trackers'>('appraisals')

  const { data: reviews, isLoading: reviewsLoading } = usePerformanceReviews()
  const { data: goals, isLoading: goalsLoading } = useGoals()
  const { data: currentEmployee } = useCurrentEmployee()

  const typedReviews = (reviews || []) as PerformanceReviewWithRelations[]
  const typedGoals = (goals || []) as GoalWithRelations[]

  const formatServiceDuration = (hireDate?: string | null) => {
    if (!hireDate) return ''

    const start = new Date(hireDate)
    const now = new Date()

    if (Number.isNaN(start.getTime()) || start > now) return ''

    let years = now.getFullYear() - start.getFullYear()
    let months = now.getMonth() - start.getMonth()

    if (now.getDate() < start.getDate()) {
      months -= 1
    }

    if (months < 0) {
      years -= 1
      months += 12
    }

    const parts: string[] = []
    if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`)
    if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)

    return parts.length ? parts.join(' ') : 'Less than 1 month'
  }

  const serviceDuration = formatServiceDuration(currentEmployee?.hire_date)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      completed: 'success',
      in_progress: 'warning',
      pending: 'info',
      draft: 'default',
      not_started: 'default',
      achieved: 'success',
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getRatingStars = (rating: number | null) => {
    if (!rating) return '-'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  const stats = [
    { label: 'Total Reviews', value: typedReviews.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Reviews', value: typedReviews.filter(r => r.status === 'pending').length, icon: TrendingUp, color: 'text-orange', bg: 'bg-orange/10' },
    { label: 'Overdue Reviews', value: typedReviews.filter(r => r.status === 'pending' && new Date(r.due_date || '') < new Date()).length, icon: ClipboardList, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
          <p className="text-gray-500 mt-1">Manage performance reviews and goals</p>
        </div>
        <Button>
          {activeTab === 'appraisals' ? (
            <>
              <ClipboardList className="w-4 h-4" />
              New Appraisal
            </>
          ) : activeTab === 'btor' ? (
            <>
              <Briefcase className="w-4 h-4" />
              New Report
            </>
          ) : activeTab === 'urf' ? (
            <>
              <FileText className="w-4 h-4" />
              New Unit Report
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Tracker
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('appraisals')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appraisals'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            Appraisal Form
          </button>
          <button
            onClick={() => setActiveTab('btor')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'btor'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Back to Office Report
          </button>
          <button
            onClick={() => setActiveTab('urf')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'urf'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Unit Reporting Form
          </button>
          <button
            onClick={() => setActiveTab('trackers')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'trackers'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Performance Trackers
          </button>
        </nav>
      </div>

      {/* Appraisals Tab */}
      {activeTab === 'appraisals' && (
        <PerformanceAppraisalWorkspace
          initialAppraiseeName={`${currentEmployee?.first_name || ''} ${currentEmployee?.last_name || ''}`.trim()}
          initialAppraiserName={`${currentEmployee?.manager?.first_name || ''} ${currentEmployee?.manager?.last_name || ''}`.trim()}
          initialDepartment={currentEmployee?.department?.name || ''}
          initialPosition={currentEmployee?.job_title?.title || ''}
          initialTimeInPresentPosition={serviceDuration}
          initialLengthOfService={serviceDuration}
          storageScopeKey={String(currentEmployee?.id || currentEmployee?.employee_id || 'anonymous')}
        />
      )}

      {/* Back to Office Report Tab */}
      {activeTab === 'btor' && (
        <BackToOfficeReport
          initialStaffName={`${currentEmployee?.first_name || ''} ${currentEmployee?.last_name || ''}`.trim()}
          initialUnit={currentEmployee?.department?.name || ''}
        />
      )}

      {/* Unit Reporting Form Tab */}
      {activeTab === 'urf' && (
        <UnitReportingForm
          initialUnitName={currentEmployee?.department?.name || ''}
          initialUnitType="Functional Unit"
        />
      )}

      {/* Trackers Tab */}
      {activeTab === 'trackers' && (
        <Card className="p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Trackers</h3>
          <p className="text-gray-500 mb-4">Track KPIs and performance metrics for your team.</p>
          <Button>Configure Trackers</Button>
        </Card>
      )}
    </div>
  )
}
