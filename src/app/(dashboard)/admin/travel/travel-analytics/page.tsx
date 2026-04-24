'use client'

import React, { useState, useMemo } from 'react'
import { 
  BarChart3, TrendingUp, DollarSign, MapPin, Calendar,
  Users, Plane, Hotel, Car, Clock, Filter, Download,
  Eye, FileText, PieChart, Activity, Globe, CheckCircle, XCircle
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useTravelRequests } from '@/hooks/useTravel'
import { useDepartments } from '@/hooks'

interface TravelAnalytic {
  period: string
  totalSpend: number
  totalTrips: number
  averageTripCost: number
  topDestinations: {
    city: string
    country: string
    trips: number
    spend: number
  }[]
  categoryBreakdown: {
    category: string
    amount: number
    percentage: number
    trips: number
  }[]
  departmentSpend: {
    department: string
    amount: number
    trips: number
    averageCost: number
  }[]
  monthlyTrend: {
    month: string
    spend: number
    trips: number
  }[]
  complianceMetrics: {
    totalViolations: number
    complianceRate: number
    savings: number
    policyAdherence: number
  }
  vendorPerformance: {
    vendor: string
    category: string
    bookings: number
    totalSpend: number
    rating: number
    onTimePerformance?: number
  }[]
}

interface CostAnalysis {
  id: string
  type: 'department' | 'route' | 'vendor' | 'policy'
  title: string
  description: string
  currentPeriod: {
    value: number
    trips: number
  }
  previousPeriod: {
    value: number
    trips: number
  }
  change: {
    amount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }
  insights: string[]
  recommendations: string[]
}

const TravelAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'spending' | 'trends' | 'compliance'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('ytd')

  // ── Live data ──────────────────────────────────────────────────────────────
  const { data: allRequests = [], isLoading: requestsLoading } = useTravelRequests()
  const { data: departments = [] } = useDepartments()

  const liveStats = useMemo(() => {
    const approved   = allRequests.filter(r => r.status === 'approved')
    const pending    = allRequests.filter(r => r.status === 'submitted' || r.status === 'pending_approval')
    const rejected   = allRequests.filter(r => r.status === 'rejected')
    const draft      = allRequests.filter(r => r.status === 'draft')
    const totalCost  = approved.reduce((s, r) => s + (r.estimated_cost ?? 0), 0)
    const avgCost    = approved.length > 0 ? totalCost / approved.length : 0

    // Top destinations (approved only)
    const destMap: Record<string, { trips: number; cost: number }> = {}
    for (const r of approved) {
      const dest = r.destination ?? 'Unknown'
      if (!destMap[dest]) destMap[dest] = { trips: 0, cost: 0 }
      destMap[dest].trips++
      destMap[dest].cost += r.estimated_cost ?? 0
    }
    const topDestinations = Object.entries(destMap)
      .sort((a, b) => b[1].trips - a[1].trips)
      .slice(0, 5)
      .map(([destination, v]) => ({ destination, ...v }))

    // Monthly trend
    const monthMap: Record<string, { trips: number; cost: number }> = {}
    for (const r of allRequests) {
      const dateStr = r.start_date ?? (r as any).created_at
      if (!dateStr) continue
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[key]) monthMap[key] = { trips: 0, cost: 0 }
      monthMap[key].trips++
      monthMap[key].cost += r.estimated_cost ?? 0
    }
    const monthlyTrend = Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, v]) => {
        const [yr, mo] = key.split('-')
        const label = new Date(Number(yr), Number(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
        return { label, ...v }
      })
    const maxMonthCost = Math.max(...monthlyTrend.map(m => m.cost), 1)

    // Department spend
    const deptMap: Record<string, { trips: number; cost: number; name: string }> = {}
    for (const r of allRequests) {
      const deptId = r.employee?.department_id
      if (!deptId) continue
      const deptName = departments.find(d => d.id === deptId)?.name ?? 'Unknown'
      if (!deptMap[deptId]) deptMap[deptId] = { trips: 0, cost: 0, name: deptName }
      deptMap[deptId].trips++
      deptMap[deptId].cost += r.estimated_cost ?? 0
    }
    const departmentStats = Object.values(deptMap).sort((a, b) => b.cost - a.cost)

    return {
      total: allRequests.length,
      approvedCount: approved.length, pendingCount: pending.length,
      rejectedCount: rejected.length, draftCount: draft.length,
      totalCost, avgCost, topDestinations, monthlyTrend, maxMonthCost, departmentStats,
    }
  }, [allRequests, departments])
  // ──────────────────────────────────────────────────────────────

  const travelAnalytics: TravelAnalytic = {
    period: 'Year to Date 2024',
    totalSpend: 2456000,
    totalTrips: 1847,
    averageTripCost: 1330,
    topDestinations: [
      { city: 'New York', country: 'USA', trips: 245, spend: 387500 },
      { city: 'London', country: 'UK', trips: 189, spend: 298400 },
      { city: 'San Francisco', country: 'USA', trips: 167, spend: 234300 },
      { city: 'Toronto', country: 'Canada', trips: 142, spend: 189600 },
      { city: 'Chicago', country: 'USA', trips: 134, spend: 178900 }
    ],
    categoryBreakdown: [
      { category: 'Flights', amount: 1105000, percentage: 45.0, trips: 1847 },
      { category: 'Hotels', amount: 663600, percentage: 27.0, trips: 1623 },
      { category: 'Meals', amount: 368400, percentage: 15.0, trips: 1847 },
      { category: 'Ground Transport', amount: 196480, percentage: 8.0, trips: 1456 },
      { category: 'Other', amount: 122520, percentage: 5.0, trips: 892 }
    ],
    departmentSpend: [
      { department: 'Sales', amount: 892000, trips: 567, averageCost: 1573 },
      { department: 'Marketing', amount: 564000, trips: 345, averageCost: 1635 },
      { department: 'Engineering', amount: 445000, trips: 289, averageCost: 1540 },
      { department: 'Operations', amount: 334000, trips: 234, averageCost: 1427 },
      { department: 'Executive', amount: 221000, trips: 78, averageCost: 2833 }
    ],
    monthlyTrend: [
      { month: 'Jan', spend: 198000, trips: 145 },
      { month: 'Feb', spend: 223000, trips: 168 },
      { month: 'Mar', spend: 267000, trips: 189 },
      { month: 'Apr', spend: 234000, trips: 178 },
      { month: 'May', spend: 289000, trips: 201 },
      { month: 'Jun', spend: 245000, trips: 187 }
    ],
    complianceMetrics: {
      totalViolations: 147,
      complianceRate: 92.1,
      savings: 342000,
      policyAdherence: 89.5
    },
    vendorPerformance: [
      { vendor: 'American Airlines', category: 'Airline', bookings: 287, totalSpend: 445600, rating: 4.5, onTimePerformance: 87 },
      { vendor: 'Marriott', category: 'Hotel', bookings: 234, totalSpend: 298700, rating: 4.6 },
      { vendor: 'Enterprise', category: 'Car Rental', bookings: 156, totalSpend: 89400, rating: 4.3 },
      { vendor: 'Hilton', category: 'Hotel', bookings: 189, totalSpend: 245800, rating: 4.4 },
      { vendor: 'Delta Airlines', category: 'Airline', bookings: 223, totalSpend: 367800, rating: 4.2, onTimePerformance: 84 }
    ]
  }

  const costAnalyses: CostAnalysis[] = [
    {
      id: 'DEPT001',
      type: 'department',
      title: 'Sales Department Travel Costs',
      description: 'Quarterly analysis of sales team travel expenses and ROI',
      currentPeriod: { value: 234000, trips: 156 },
      previousPeriod: { value: 198000, trips: 134 },
      change: { amount: 36000, percentage: 18.2, trend: 'up' },
      insights: [
        'Increase driven by new client acquisition activities',
        'Average trip cost increased by 12%',
        'International travel up 25%'
      ],
      recommendations: [
        'Implement virtual meetings for initial client contacts',
        'Negotiate better rates for frequently visited routes',
        'Bundle trips to optimize travel efficiency'
      ]
    },
    {
      id: 'ROUTE001',
      type: 'route',
      title: 'NYC-LAX Route Analysis',
      description: 'Cost analysis for highest volume domestic route',
      currentPeriod: { value: 89000, trips: 67 },
      previousPeriod: { value: 94000, trips: 72 },
      change: { amount: -5000, percentage: -5.3, trend: 'down' },
      insights: [
        'Successful implementation of advance booking policy',
        'Reduced last-minute bookings by 40%',
        'Improved vendor negotiations resulted in 8% rate reduction'
      ],
      recommendations: [
        'Apply same advance booking strategy to other high-volume routes',
        'Consider corporate housing for extended stays',
        'Evaluate alternative airports for cost savings'
      ]
    }
  ]

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-600'
      case 'down': return 'text-green-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      case 'stable': return '→'
      default: return '→'
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI cards — live data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Total Approved Budget</h4>
          <p className="text-2xl font-bold text-blue-600">₱{liveStats.totalCost.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{liveStats.approvedCount} approved trips</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <Plane className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Total Requests</h4>
          <p className="text-2xl font-bold text-green-600">{liveStats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{liveStats.pendingCount} pending approval</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-orange-100 rounded-lg inline-block mb-4">
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Avg Trip Cost</h4>
          <p className="text-2xl font-bold text-orange-600">₱{Math.round(liveStats.avgCost).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Per approved trip</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-red-100 rounded-lg inline-block mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Rejected</h4>
          <p className="text-2xl font-bold text-red-600">{liveStats.rejectedCount}</p>
          <p className="text-sm text-gray-500">{liveStats.draftCount} still in draft</p>
        </Card>
      </div>

      {/* Status breakdown + Top destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Request Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Approved',         value: liveStats.approvedCount, color: 'bg-green-500' },
              { label: 'Pending Approval', value: liveStats.pendingCount,  color: 'bg-yellow-500' },
              { label: 'Rejected',         value: liveStats.rejectedCount, color: 'bg-red-500'    },
              { label: 'Draft',            value: liveStats.draftCount,    color: 'bg-gray-400'   },
            ].map(({ label, value, color }) => {
              const pct = liveStats.total > 0 ? (value / liveStats.total) * 100 : 0
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-medium">{value} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Destinations (Approved)</h3>
          {liveStats.topDestinations.length === 0 ? (
            <p className="text-gray-500 text-sm">No approved trips yet.</p>
          ) : (
            <div className="space-y-3">
              {liveStats.topDestinations.map((dest, index) => (
                <div key={dest.destination} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-400'
                  }`}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{dest.destination}</p>
                    <p className="text-xs text-gray-500">{dest.trips} trip{dest.trips !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-bold text-gray-900 flex-shrink-0">₱{dest.cost.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly trend — live */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Monthly Travel Trend (last 6 months)</h3>
        {liveStats.monthlyTrend.length === 0 ? (
          <p className="text-gray-500 text-sm">No data available yet.</p>
        ) : (
          <div className="flex items-end gap-4" style={{ height: '140px' }}>
            {liveStats.monthlyTrend.map(month => {
              const barPct = liveStats.maxMonthCost > 0
                ? Math.max((month.cost / liveStats.maxMonthCost) * 100, 4) : 4
              return (
                <div key={month.label} className="flex flex-col items-center gap-1 flex-1">
                  <p className="text-xs text-gray-500">₱{(month.cost / 1000).toFixed(0)}k</p>
                  <div className="w-full bg-blue-500 rounded-t-md" style={{ height: `${barPct}px` }} />
                  <p className="text-xs font-medium text-gray-700">{month.label}</p>
                  <p className="text-xs text-gray-400">{month.trips} trips</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Department breakdown — live */}
      {liveStats.departmentStats.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Travel by Department</h3>
          <div className="space-y-3">
            {liveStats.departmentStats.map(dept => (
              <div key={dept.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{dept.name}</p>
                  <p className="text-sm text-gray-500">{dept.trips} request{dept.trips !== 1 ? 's' : ''}</p>
                </div>
                <p className="font-bold text-gray-900">₱{dept.cost.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )

  const renderSpending = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Department Spending</h3>
          <div className="space-y-3">
            {travelAnalytics.departmentSpend.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{dept.department}</p>
                  <p className="text-sm text-gray-600">{dept.trips} trips • Avg: ${dept.averageCost}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${dept.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    {((dept.amount / travelAnalytics.totalSpend) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Vendor Performance</h3>
          <div className="space-y-3">
            {travelAnalytics.vendorPerformance.map((vendor, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{vendor.vendor}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{vendor.category}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span>⭐ {vendor.rating}</span>
                    </div>
                    {vendor.onTimePerformance && (
                      <>
                        <span>•</span>
                        <span>{vendor.onTimePerformance}% OTP</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${vendor.totalSpend.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{vendor.bookings} bookings</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cost Analysis Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {costAnalyses.map((analysis) => (
            <div key={analysis.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{analysis.title}</h4>
                  <p className="text-sm text-gray-600">{analysis.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {analysis.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Current Period</p>
                  <p className="font-bold text-gray-900">${analysis.currentPeriod.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{analysis.currentPeriod.trips} trips</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Previous Period</p>
                  <p className="font-bold text-gray-900">${analysis.previousPeriod.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{analysis.previousPeriod.trips} trips</p>
                </div>
              </div>

              <div className="mb-4 p-3 border-l-4 border-blue-500 bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getTrendIcon(analysis.change.trend)}</span>
                  <span className={`font-bold ${getTrendColor(analysis.change.trend)}`}>
                    {analysis.change.percentage > 0 ? '+' : ''}{analysis.change.percentage}%
                  </span>
                  <span className="text-sm text-gray-600">
                    (${Math.abs(analysis.change.amount).toLocaleString()})
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Key Insights:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Recommendations:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderTrends = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Travel Trends Analysis</h3>
            <p className="text-blue-700 mt-1">
              Identify patterns, seasonal variations, and emerging trends in travel spending and behavior.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Peak Travel Month</h4>
          <p className="text-2xl font-bold text-green-600">May</p>
          <p className="text-sm text-gray-500">$289K spend, 201 trips</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-orange-100 rounded-lg inline-block mb-4">
            <Globe className="w-8 h-8 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">International vs Domestic</h4>
          <p className="text-2xl font-bold text-orange-600">65:35</p>
          <p className="text-sm text-gray-500">Domestic : International</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-purple-100 rounded-lg inline-block mb-4">
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Avg Trip Duration</h4>
          <p className="text-2xl font-bold text-purple-600">3.2</p>
          <p className="text-sm text-gray-500">Days per trip</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Seasonal Patterns</h3>
          <div className="space-y-4">
            {[
              { season: 'Q1 2024', spend: 688000, trips: 502, trend: 'up', change: 12 },
              { season: 'Q2 2024', spend: 768000, trips: 566, trend: 'up', change: 18 },
              { season: 'Q3 2024 (Projected)', spend: 645000, trips: 485, trend: 'down', change: -8 },
              { season: 'Q4 2024 (Projected)', spend: 589000, trips: 432, trend: 'down', change: -15 }
            ].map((quarter, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{quarter.season}</p>
                  <p className="text-sm text-gray-600">{quarter.trips} trips</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${quarter.spend.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-lg">{getTrendIcon(quarter.trend)}</span>
                    <span className={`text-sm font-medium ${getTrendColor(quarter.trend)}`}>
                      {quarter.change > 0 ? '+' : ''}{quarter.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Booking Patterns</h3>
          <div className="space-y-4">
            {[
              { metric: 'Advance Booking', current: '14 days', previous: '10 days', improvement: true },
              { metric: 'Last-Minute Bookings', current: '18%', previous: '25%', improvement: true },
              { metric: 'Weekend Travel', current: '12%', previous: '8%', improvement: false },
              { metric: 'Extended Stays (>5 days)', current: '23%', previous: '19%', improvement: false },
              { metric: 'Multi-City Trips', current: '15%', previous: '12%', improvement: false }
            ].map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{pattern.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{pattern.current}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pattern.improvement ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    vs {pattern.previous}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <Activity className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Compliance Rate</h4>
          <p className="text-2xl font-bold text-green-600">
            {travelAnalytics.complianceMetrics.complianceRate}%
          </p>
          <p className="text-sm text-gray-500">Policy adherence</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-red-100 rounded-lg inline-block mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Total Violations</h4>
          <p className="text-2xl font-bold text-red-600">
            {travelAnalytics.complianceMetrics.totalViolations}
          </p>
          <p className="text-sm text-gray-500">Policy violations</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Cost Savings</h4>
          <p className="text-2xl font-bold text-blue-600">
            ${travelAnalytics.complianceMetrics.savings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Policy enforcement</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-purple-100 rounded-lg inline-block mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Adherence Trend</h4>
          <p className="text-2xl font-bold text-purple-600">
            {travelAnalytics.complianceMetrics.policyAdherence}%
          </p>
          <p className="text-sm text-gray-500">Improvement +5%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Compliance by Policy Type</h3>
          <div className="space-y-3">
            {[
              { policy: 'Advance Booking (14 days)', compliance: 94, violations: 23, color: 'bg-green-500' },
              { policy: 'Hotel Rate Limits', compliance: 89, violations: 42, color: 'bg-blue-500' },
              { policy: 'Flight Class Restrictions', compliance: 96, violations: 15, color: 'bg-teal-500' },
              { policy: 'Meal Allowances', compliance: 87, violations: 38, color: 'bg-orange-500' },
              { policy: 'Ground Transport', compliance: 92, violations: 29, color: 'bg-purple-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="font-medium text-gray-900">{item.policy}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{item.compliance}%</span>
                  <p className="text-sm text-gray-600">{item.violations} violations</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Department Compliance</h3>
          <div className="space-y-3">
            {[
              { department: 'Finance', compliance: 98, savings: 45000 },
              { department: 'Operations', compliance: 95, savings: 38000 },
              { department: 'Engineering', compliance: 93, savings: 52000 },
              { department: 'Marketing', compliance: 90, savings: 34000 },
              { department: 'Sales', compliance: 88, savings: 67000 }
            ].map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{dept.department}</p>
                  <p className="text-sm text-gray-600">Savings: ${dept.savings.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{dept.compliance}%</p>
                  <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${dept.compliance}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive analysis of travel spending, trends, and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="ytd">Year to Date</option>
            <option value="q2">Q2 2024</option>
            <option value="q1">Q1 2024</option>
            <option value="2023">Full Year 2023</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'spending', label: 'Spending Analysis', icon: DollarSign },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'compliance', label: 'Compliance', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'spending' && renderSpending()}
          {activeTab === 'trends' && renderTrends()}
          {activeTab === 'compliance' && renderCompliance()}
        </div>
      </Card>
    </div>
  )
}

export default TravelAnalyticsPage