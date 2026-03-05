'use client'

import React, { useState } from 'react'
import { 
  Receipt, DollarSign, CreditCard, FileText, Plus, Edit,
  Search, Filter, Download, Calendar, Tag, Building,
  CheckCircle, XCircle, Clock, AlertTriangle, Eye,
  Paperclip, User, MapPin
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'

interface ExpenseEntry {
  id: string
  expenseNumber: string
  employeeId: string
  employeeName: string
  department: string
  tripId?: string
  tripDestination?: string
  date: string
  category: 'meals' | 'accommodation' | 'transport' | 'entertainment' | 'communication' | 'other'
  subcategory?: string
  merchant: string
  description: string
  amount: number
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  exchangeRate?: number
  localAmount?: number
  paymentMethod: 'corporate_card' | 'personal_card' | 'cash' | 'bank_transfer'
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid'
  receiptAttached: boolean
  billable: boolean
  clientCode?: string
  projectCode?: string
  taxAmount?: number
  taxRate?: number
  submittedDate?: string
  approvedBy?: string
  approvedDate?: string
  rejectionReason?: string
  reimbursementDate?: string
  violatesPolicy?: boolean
  policyViolationReason?: string
  tags: string[]
}

interface ReimbursementRequest {
  id: string
  requestNumber: string
  employeeId: string
  employeeName: string
  totalAmount: number
  currency: string
  expenseCount: number
  submittedDate: string
  status: 'pending' | 'processing' | 'approved' | 'paid' | 'rejected'
  paymentMethod: 'direct_deposit' | 'check' | 'payroll'
  expectedPaymentDate?: string
  processedDate?: string
  expenses: string[]
}

const ExpenseManagementPage = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'reimbursements' | 'analytics' | 'policies'>('expenses')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const expenseEntries: ExpenseEntry[] = [
    {
      id: 'EXP001',
      expenseNumber: 'EXP-2024-001',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'Sales',
      tripId: 'TR-2024-001',
      tripDestination: 'New York, NY',
      date: '2024-03-15',
      category: 'meals',
      subcategory: 'Business Dinner',
      merchant: 'The Capital Grille',
      description: 'Client dinner meeting with ABC Corp executives',
      amount: 145.50,
      currency: 'USD',
      paymentMethod: 'corporate_card',
      status: 'approved',
      receiptAttached: true,
      billable: true,
      clientCode: 'ABC-CORP',
      projectCode: 'PROJ-2024-Q1',
      taxAmount: 12.04,
      taxRate: 8.25,
      submittedDate: '2024-03-16T10:30:00Z',
      approvedBy: 'Sarah Johnson',
      approvedDate: '2024-03-17T14:20:00Z',
      tags: ['client meeting', 'billable', 'entertainment']
    },
    {
      id: 'EXP002',
      expenseNumber: 'EXP-2024-002',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'Sales',
      tripId: 'TR-2024-001',
      tripDestination: 'New York, NY',
      date: '2024-03-16',
      category: 'transport',
      subcategory: 'Taxi',
      merchant: 'Uber',
      description: 'Airport to hotel transportation',
      amount: 45.30,
      currency: 'USD',
      paymentMethod: 'personal_card',
      status: 'submitted',
      receiptAttached: true,
      billable: false,
      submittedDate: '2024-03-17T09:15:00Z',
      tags: ['ground transport']
    },
    {
      id: 'EXP003',
      expenseNumber: 'EXP-2024-003',
      employeeId: 'EMP002',
      employeeName: 'Emily Davis',
      department: 'Marketing',
      date: '2024-03-10',
      category: 'communication',
      subcategory: 'Mobile Roaming',
      merchant: 'Verizon',
      description: 'International roaming charges for business calls',
      amount: 89.99,
      currency: 'USD',
      paymentMethod: 'personal_card',
      status: 'under_review',
      receiptAttached: true,
      billable: false,
      submittedDate: '2024-03-12T16:45:00Z',
      violatesPolicy: true,
      policyViolationReason: 'Exceeds monthly communication allowance of $50',
      tags: ['communication', 'policy violation']
    }
  ]

  const reimbursementRequests: ReimbursementRequest[] = [
    {
      id: 'REIMB001',
      requestNumber: 'REIMB-2024-001',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      totalAmount: 234.80,
      currency: 'USD',
      expenseCount: 5,
      submittedDate: '2024-03-18T10:00:00Z',
      status: 'approved',
      paymentMethod: 'direct_deposit',
      expectedPaymentDate: '2024-03-25',
      expenses: ['EXP001', 'EXP002', 'EXP004', 'EXP005', 'EXP006']
    },
    {
      id: 'REIMB002',
      requestNumber: 'REIMB-2024-002',
      employeeId: 'EMP002',
      employeeName: 'Emily Davis',
      totalAmount: 156.45,
      currency: 'USD',
      expenseCount: 3,
      submittedDate: '2024-03-20T14:30:00Z',
      status: 'processing',
      paymentMethod: 'direct_deposit',
      expenses: ['EXP003', 'EXP007', 'EXP008']
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'paid': return 'success'
      case 'submitted': case 'under_review': case 'pending': case 'processing': return 'warning'
      case 'rejected': return 'danger'
      case 'draft': return 'secondary'
      default: return 'outline'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      meals: 'bg-green-100 text-green-800',
      accommodation: 'bg-blue-100 text-blue-800',
      transport: 'bg-purple-100 text-purple-800',
      entertainment: 'bg-orange-100 text-orange-800',
      communication: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meals': return '🍽️'
      case 'accommodation': return '🏨'
      case 'transport': return '🚗'
      case 'entertainment': return '🎭'
      case 'communication': return '📱'
      default: return '📄'
    }
  }

  const renderExpenses = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by employee, merchant, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="meals">Meals</option>
            <option value="accommodation">Accommodation</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="communication">Communication</option>
            <option value="other">Other</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Expense Entries */}
      {expenseEntries.map((expense) => (
        <Card key={expense.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${getCategoryColor(expense.category)}`}>
                <span className="text-lg">{getCategoryIcon(expense.category)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{expense.expenseNumber}</h4>
                  <Badge variant={getStatusColor(expense.status)} className="text-xs">
                    {expense.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {expense.violatesPolicy && (
                    <Badge variant="danger" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      POLICY VIOLATION
                    </Badge>
                  )}
                  {expense.billable && (
                    <Badge variant="info" className="text-xs">
                      BILLABLE
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{expense.employeeName} • {expense.department}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(expense.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {expense.merchant}
                  </span>
                  {expense.tripDestination && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {expense.tripDestination}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {expense.currency} {expense.amount.toFixed(2)}
              </p>
              {expense.localAmount && expense.currency !== 'USD' && (
                <p className="text-xs text-gray-500">
                  ~${expense.localAmount.toFixed(2)} USD
                </p>
              )}
              <div className="flex items-center gap-1 mt-1 text-xs">
                {expense.receiptAttached && (
                  <Badge variant="success" className="text-xs">
                    <Paperclip className="w-3 h-3 mr-1" />
                    Receipt
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              <strong>{expense.category.toUpperCase()}:</strong> {expense.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium capitalize">{expense.category}</p>
              {expense.subcategory && (
                <p className="text-xs text-gray-500">{expense.subcategory}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Payment Method</p>
              <p className="font-medium">{expense.paymentMethod.replace('_', ' ')}</p>
            </div>
            {expense.projectCode && (
              <div>
                <p className="text-gray-500">Project</p>
                <p className="font-medium font-mono text-xs">{expense.projectCode}</p>
              </div>
            )}
            {expense.taxAmount && (
              <div>
                <p className="text-gray-500">Tax</p>
                <p className="font-medium">${expense.taxAmount.toFixed(2)} ({expense.taxRate}%)</p>
              </div>
            )}
          </div>

          {expense.violatesPolicy && expense.policyViolationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  <strong>Policy Violation:</strong> {expense.policyViolationReason}
                </span>
              </div>
            </div>
          )}

          {expense.status === 'approved' && expense.approvedBy && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Approved by <strong>{expense.approvedBy}</strong> on {new Date(expense.approvedDate!).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {expense.tags.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {expense.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            {expense.status === 'submitted' && (
              <>
                <Button size="sm" variant="primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button size="sm" variant="danger">
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Receipt
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderReimbursements = () => (
    <div className="space-y-4">
      {reimbursementRequests.map((request) => (
        <Card key={request.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{request.requestNumber}</h4>
                  <Badge variant={getStatusColor(request.status)} className="text-xs">
                    {request.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{request.employeeName}</p>
                <p className="text-xs text-gray-500">
                  {request.expenseCount} expenses • Submitted {new Date(request.submittedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {request.currency} {request.totalAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{request.paymentMethod.replace('_', ' ')}</p>
              {request.expectedPaymentDate && (
                <p className="text-xs text-blue-600">
                  Expected: {new Date(request.expectedPaymentDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {request.status === 'processing' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Reimbursement is being processed. Payment expected within 5-7 business days.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Expenses
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Download Report
            </Button>
            {request.status === 'pending' && (
              <Button size="sm" variant="primary">
                Process Payment
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Total Expenses</h4>
          <p className="text-2xl font-bold text-blue-600">$127,450</p>
          <p className="text-sm text-gray-500">This month</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Reimbursements</h4>
          <p className="text-2xl font-bold text-green-600">$89,320</p>
          <p className="text-sm text-gray-500">Pending payment</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-orange-100 rounded-lg inline-block mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Policy Violations</h4>
          <p className="text-2xl font-bold text-orange-600">23</p>
          <p className="text-sm text-gray-500">Require review</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-purple-100 rounded-lg inline-block mb-4">
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Avg Processing</h4>
          <p className="text-2xl font-bold text-purple-600">4.2</p>
          <p className="text-sm text-gray-500">Days to approval</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <div className="space-y-3">
            {[
              { category: 'Meals', amount: 45230, percentage: 35.5 },
              { category: 'Transportation', amount: 32100, percentage: 25.2 },
              { category: 'Accommodation', amount: 28450, percentage: 22.3 },
              { category: 'Entertainment', amount: 15670, percentage: 12.3 },
              { category: 'Communication', amount: 6000, percentage: 4.7 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">${item.amount.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 ml-2">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Spenders</h3>
          <div className="space-y-3">
            {[
              { name: 'John Smith', department: 'Sales', amount: 12450 },
              { name: 'Emily Davis', department: 'Marketing', amount: 9320 },
              { name: 'Michael Brown', department: 'Engineering', amount: 7890 },
              { name: 'Sarah Johnson', department: 'Operations', amount: 6540 },
              { name: 'David Wilson', department: 'Finance', amount: 5230 }
            ].map((spender, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{spender.name}</p>
                  <p className="text-xs text-gray-500">{spender.department}</p>
                </div>
                <span className="text-sm font-bold">${spender.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderPolicies = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-orange-50 border-orange-200">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-orange-600 mt-1" />
          <div>
            <h3 className="font-semibold text-orange-800">Expense Policies</h3>
            <p className="text-orange-700 mt-1">
              Manage expense policies, approval limits, and compliance rules.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Category Limits</h3>
          <div className="space-y-4">
            {[
              { category: 'Meals (per day)', limit: 75, description: 'Includes breakfast, lunch, dinner' },
              { category: 'Hotel (per night)', limit: 200, description: 'Standard business accommodation' },
              { category: 'Ground Transport', limit: 100, description: 'Taxis, rideshare, parking per day' },
              { category: 'Communication', limit: 50, description: 'Monthly roaming and calls' },
              { category: 'Entertainment', limit: 150, description: 'Client entertainment per event' }
            ].map((policy, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{policy.category}</p>
                  <p className="text-sm text-gray-600">{policy.description}</p>
                </div>
                <Badge variant="outline">${policy.limit}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Approval Rules</h3>
          <div className="space-y-4">
            {[
              { rule: 'Auto-approval', threshold: '$25', description: 'Expenses under this amount are auto-approved' },
              { rule: 'Manager approval', threshold: '$25 - $500', description: 'Requires direct manager approval' },
              { rule: 'Department head', threshold: '$500 - $2000', description: 'Requires department head approval' },
              { rule: 'Finance approval', threshold: '$2000+', description: 'Requires finance team approval' }
            ].map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{rule.rule}</p>
                  <p className="text-sm text-gray-600">{rule.description}</p>
                </div>
                <Badge variant="secondary">{rule.threshold}</Badge>
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
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-500 mt-1">Track expenses, manage reimbursements, and ensure policy compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
          {[
            { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenseEntries.length },
            { id: 'reimbursements', label: 'Reimbursements', icon: DollarSign, count: reimbursementRequests.length },
            { id: 'analytics', label: 'Analytics', icon: FileText },
            { id: 'policies', label: 'Policies', icon: FileText }
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
                {tab.count !== undefined && (
                  <Badge variant={activeTab === tab.id ? "outline" : "secondary"} className="ml-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'reimbursements' && renderReimbursements()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'policies' && renderPolicies()}
        </div>
      </Card>
    </div>
  )
}

export default ExpenseManagementPage