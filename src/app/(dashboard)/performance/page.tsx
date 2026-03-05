'use client'

import { useState } from 'react'
import { Plus, Search, Target, Star, TrendingUp, FileText } from 'lucide-react'
import { usePerformanceReviews, useGoals } from '@/hooks'
import { Card, Button, Badge, Avatar } from '@/components/ui'
import type { PerformanceReviewWithRelations, GoalWithRelations } from '@/services'

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'goals' | 'trackers'>('reviews')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: reviews, isLoading: reviewsLoading } = usePerformanceReviews()
  const { data: goals, isLoading: goalsLoading } = useGoals()

  const typedReviews = (reviews || []) as PerformanceReviewWithRelations[]
  const typedGoals = (goals || []) as GoalWithRelations[]

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
    { label: 'Active Goals', value: typedGoals.filter(g => g.status === 'in_progress').length, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completed Goals', value: typedGoals.filter(g => g.status === 'achieved').length, icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
          <p className="text-gray-500 mt-1">Manage performance reviews and goals</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          {activeTab === 'reviews' ? 'Add Review' : 'Add Goal'}
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
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            My Reviews
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'goals'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            My Goals
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

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Review Period</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviewsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : typedReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No performance reviews found.
                    </td>
                  </tr>
                ) : (
                  typedReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={review.employee?.avatar_url}
                            firstName={review.employee?.first_name || 'U'}
                            lastName={review.employee?.last_name || ''}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {review.employee?.first_name} {review.employee?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{review.employee?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {review.review_period || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {review.due_date ? new Date(review.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getRatingStars(review.overall_rating)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(review.status || 'pending')}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="outline" size="sm">View</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goalsLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
            </div>
          ) : typedGoals.length === 0 ? (
            <Card className="col-span-full p-12 text-center text-gray-500">
              No goals found. Click "Add Goal" to create one.
            </Card>
          ) : (
            typedGoals.map((goal) => (
              <Card key={goal.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange/10 rounded-lg">
                    <Target className="w-5 h-5 text-orange" />
                  </div>
                  {getStatusBadge(goal.status || 'not_started')}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{goal.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{goal.description || 'No description'}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{goal.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>Due: {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'Not set'}</span>
                  <button className="text-orange hover:underline">Edit</button>
                </div>
              </Card>
            ))
          )}
        </div>
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
