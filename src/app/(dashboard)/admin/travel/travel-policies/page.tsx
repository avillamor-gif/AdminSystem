'use client'

import React, { useState } from 'react'
import { 
  Shield, FileText, DollarSign, Users, AlertTriangle,
  CheckCircle, Edit, Plus, Eye, Search, Filter,
  Building, Globe, CreditCard, Calendar, Clock,
  MapPin, Plane, Hotel, Car
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'

interface TravelPolicy {
  id: string
  name: string
  version: string
  effectiveDate: string
  status: 'active' | 'draft' | 'archived'
  category: 'general' | 'booking' | 'expense' | 'approval' | 'emergency'
  scope: 'global' | 'regional' | 'department'
  applicableTo: string[]
  description: string
  rules: PolicyRule[]
  approvalRequired: boolean
  lastUpdated: string
  updatedBy: string
  violations: number
  compliance: number
}

interface PolicyRule {
  id: string
  title: string
  description: string
  type: 'limit' | 'requirement' | 'restriction' | 'guideline'
  severity: 'mandatory' | 'recommended' | 'optional'
  category: string
  value?: string | number
  conditions?: string[]
  exceptions?: string[]
}

interface ComplianceCheck {
  id: string
  employeeId: string
  employeeName: string
  department: string
  requestId: string
  policyId: string
  policyName: string
  ruleViolated: string
  severity: 'high' | 'medium' | 'low'
  status: 'pending_review' | 'approved' | 'rejected' | 'exception_granted'
  details: string
  dateOccurred: string
  reviewedBy?: string
  resolution?: string
}

const TravelPoliciesPage = () => {
  const [activeTab, setActiveTab] = useState<'policies' | 'compliance' | 'violations' | 'templates'>('policies')
  const [searchQuery, setSearchQuery] = useState('')

  const travelPolicies: TravelPolicy[] = [
    {
      id: 'POL001',
      name: 'Global Travel Policy',
      version: '2.1',
      effectiveDate: '2024-01-01',
      status: 'active',
      category: 'general',
      scope: 'global',
      applicableTo: ['All Employees'],
      description: 'Comprehensive global travel policy covering all aspects of business travel',
      rules: [
        {
          id: 'R001',
          title: 'Flight Booking Class',
          description: 'Domestic flights must be economy class for trips under 4 hours',
          type: 'restriction',
          severity: 'mandatory',
          category: 'transportation',
          conditions: ['Domestic flights', 'Duration < 4 hours']
        },
        {
          id: 'R002',
          title: 'Hotel Rate Limit',
          description: 'Hotel accommodation not to exceed $200 per night in standard cities',
          type: 'limit',
          severity: 'mandatory',
          category: 'accommodation',
          value: 200,
          exceptions: ['Major metropolitan areas', 'Peak season']
        }
      ],
      approvalRequired: true,
      lastUpdated: '2024-02-15T10:30:00Z',
      updatedBy: 'Policy Team',
      violations: 12,
      compliance: 94
    },
    {
      id: 'POL002',
      name: 'Executive Travel Policy',
      version: '1.5',
      effectiveDate: '2024-01-01',
      status: 'active',
      category: 'booking',
      scope: 'department',
      applicableTo: ['C-Level', 'VP Level', 'Directors'],
      description: 'Enhanced travel policy for executive level employees',
      rules: [
        {
          id: 'R003',
          title: 'Business Class Authorization',
          description: 'Executive level can book business class for flights over 3 hours',
          type: 'requirement',
          severity: 'recommended',
          category: 'transportation',
          conditions: ['Flight duration > 3 hours', 'Executive level or above']
        },
        {
          id: 'R004',
          title: 'Premium Hotel Authorization',
          description: 'Executives can book premium hotels up to $350 per night',
          type: 'limit',
          severity: 'mandatory',
          category: 'accommodation',
          value: 350
        }
      ],
      approvalRequired: false,
      lastUpdated: '2024-01-20T14:20:00Z',
      updatedBy: 'HR Director',
      violations: 3,
      compliance: 98
    },
    {
      id: 'POL003',
      name: 'Expense Reimbursement Policy',
      version: '3.0',
      effectiveDate: '2024-03-01',
      status: 'active',
      category: 'expense',
      scope: 'global',
      applicableTo: ['All Employees'],
      description: 'Policy governing expense reporting and reimbursement procedures',
      rules: [
        {
          id: 'R005',
          title: 'Receipt Requirement',
          description: 'Receipts required for all expenses over $25',
          type: 'requirement',
          severity: 'mandatory',
          category: 'documentation',
          value: 25
        },
        {
          id: 'R006',
          title: 'Meal Allowance',
          description: 'Daily meal allowance not to exceed $75 per person',
          type: 'limit',
          severity: 'mandatory',
          category: 'meals',
          value: 75
        }
      ],
      approvalRequired: true,
      lastUpdated: '2024-02-28T09:00:00Z',
      updatedBy: 'Finance Team',
      violations: 18,
      compliance: 91
    }
  ]

  const complianceChecks: ComplianceCheck[] = [
    {
      id: 'CC001',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      department: 'Sales',
      requestId: 'TR-2024-001',
      policyId: 'POL001',
      policyName: 'Global Travel Policy',
      ruleViolated: 'Hotel Rate Limit',
      severity: 'medium',
      status: 'pending_review',
      details: 'Hotel rate of $245/night exceeds standard limit of $200/night for NYC',
      dateOccurred: '2024-03-15T10:30:00Z'
    },
    {
      id: 'CC002',
      employeeId: 'EMP003',
      employeeName: 'Michael Brown',
      department: 'Engineering',
      requestId: 'TR-2024-003',
      policyId: 'POL003',
      policyName: 'Expense Reimbursement Policy',
      ruleViolated: 'Meal Allowance',
      severity: 'high',
      status: 'rejected',
      details: 'Daily meal expense of $120 exceeds policy limit of $75',
      dateOccurred: '2024-03-10T14:20:00Z',
      reviewedBy: 'Finance Manager',
      resolution: 'Request rejected - exceeds policy limits significantly'
    },
    {
      id: 'CC003',
      employeeId: 'EMP002',
      employeeName: 'Emily Davis',
      department: 'Marketing',
      requestId: 'TR-2024-002',
      policyId: 'POL001',
      policyName: 'Global Travel Policy',
      ruleViolated: 'Flight Booking Class',
      severity: 'low',
      status: 'exception_granted',
      details: 'Business class booking for domestic flight due to medical condition',
      dateOccurred: '2024-03-08T16:45:00Z',
      reviewedBy: 'HR Manager',
      resolution: 'Exception granted due to documented medical requirement'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved': case 'exception_granted': return 'success'
      case 'pending_review': case 'draft': return 'warning'
      case 'rejected': case 'archived': return 'danger'
      default: return 'outline'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': case 'mandatory': return 'danger'
      case 'medium': case 'recommended': return 'warning'
      case 'low': case 'optional': return 'success'
      default: return 'outline'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Shield className="w-4 h-4" />
      case 'booking': return <Calendar className="w-4 h-4" />
      case 'expense': return <DollarSign className="w-4 h-4" />
      case 'approval': return <CheckCircle className="w-4 h-4" />
      case 'emergency': return <AlertTriangle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const renderPolicies = () => (
    <div className="space-y-4">
      {travelPolicies.map((policy) => (
        <Card key={policy.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                {getCategoryIcon(policy.category)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                  <Badge variant="outline" className="text-xs">v{policy.version}</Badge>
                  <Badge variant={getStatusColor(policy.status)} className="text-xs">
                    {policy.status.toUpperCase()}
                  </Badge>
                  <Badge 
                    variant={policy.scope === 'global' ? 'info' : 'secondary'} 
                    className="text-xs"
                  >
                    {policy.scope.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {policy.applicableTo.join(', ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{policy.compliance}%</p>
              <p className="text-xs text-gray-500">Compliance</p>
              {policy.violations > 0 && (
                <p className="text-xs text-red-600 mt-1">{policy.violations} violations</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Policy Rules ({policy.rules.length})</p>
            <div className="space-y-2">
              {policy.rules.slice(0, 2).map((rule) => (
                <div key={rule.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-gray-900">{rule.title}</h5>
                    <Badge variant={getSeverityColor(rule.severity)} className="text-xs">
                      {rule.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{rule.description}</p>
                  {rule.value && (
                    <p className="text-xs text-blue-600 mt-1">
                      Limit: {typeof rule.value === 'number' ? `$${rule.value}` : rule.value}
                    </p>
                  )}
                </div>
              ))}
              {policy.rules.length > 2 && (
                <p className="text-xs text-gray-500 text-center">
                  +{policy.rules.length - 2} more rules
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Last updated: {new Date(policy.lastUpdated).toLocaleDateString()} by {policy.updatedBy}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Edit Policy
            </Button>
            <Button size="sm" variant="outline">
              Compliance Report
            </Button>
            {policy.status === 'draft' && (
              <Button size="sm" variant="primary">
                <CheckCircle className="w-3 h-3 mr-1" />
                Activate
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Overall Compliance</h4>
          <p className="text-2xl font-bold text-green-600">94.2%</p>
          <p className="text-sm text-gray-500">Across all policies</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-yellow-100 rounded-lg inline-block mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Pending Reviews</h4>
          <p className="text-2xl font-bold text-yellow-600">12</p>
          <p className="text-sm text-gray-500">Requiring attention</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-red-100 rounded-lg inline-block mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Policy Violations</h4>
          <p className="text-2xl font-bold text-red-600">33</p>
          <p className="text-sm text-gray-500">This month</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Exceptions Granted</h4>
          <p className="text-2xl font-bold text-blue-600">8</p>
          <p className="text-sm text-gray-500">Valid exceptions</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Policy Compliance by Department</h3>
        <div className="space-y-4">
          {[
            { department: 'Sales', compliance: 96, violations: 8, color: 'bg-green-500' },
            { department: 'Marketing', compliance: 92, violations: 12, color: 'bg-blue-500' },
            { department: 'Engineering', compliance: 94, violations: 7, color: 'bg-purple-500' },
            { department: 'Operations', compliance: 91, violations: 15, color: 'bg-orange-500' },
            { department: 'Finance', compliance: 98, violations: 3, color: 'bg-teal-500' }
          ].map((dept, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                <div>
                  <p className="font-medium text-gray-900">{dept.department}</p>
                  <p className="text-sm text-gray-600">{dept.violations} violations this month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{dept.compliance}%</p>
                <p className="text-sm text-gray-500">Compliance</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderViolations = () => (
    <div className="space-y-4">
      {complianceChecks.map((check) => (
        <Card key={check.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{check.ruleViolated}</h4>
                  <Badge variant={getSeverityColor(check.severity)} className="text-xs">
                    {check.severity.toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusColor(check.status)} className="text-xs">
                    {check.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{check.employeeName} • {check.department}</p>
                <p className="text-xs text-gray-500">
                  Request: {check.requestId} • Policy: {check.policyName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(check.dateOccurred).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Violation Details:</strong> {check.details}
            </p>
          </div>

          {check.resolution && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Resolution:</strong> {check.resolution}
              </p>
              {check.reviewedBy && (
                <p className="text-xs text-blue-600 mt-1">
                  Reviewed by: {check.reviewedBy}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Request
            </Button>
            {check.status === 'pending_review' && (
              <>
                <Button size="sm" variant="primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Grant Exception
                </Button>
                <Button size="sm" variant="danger">
                  Reject Request
                </Button>
              </>
            )}
            <Button size="sm" variant="outline">
              View Policy
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderTemplates = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <h3 className="font-semibold text-green-800">Policy Templates</h3>
            <p className="text-green-700 mt-1">
              Pre-built policy templates to quickly create new travel policies for different scenarios.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            name: 'International Travel Policy',
            description: 'Comprehensive policy template for international business travel including visa, currency, and insurance requirements',
            category: 'Regional Policy',
            rules: 15,
            usage: 'High'
          },
          {
            name: 'Department-Specific Policy',
            description: 'Customizable template for department-specific travel policies with role-based restrictions',
            category: 'Departmental Policy',
            rules: 12,
            usage: 'Medium'
          },
          {
            name: 'Emergency Travel Policy',
            description: 'Fast-track policy template for urgent or emergency business travel situations',
            category: 'Emergency Policy',
            rules: 8,
            usage: 'Low'
          },
          {
            name: 'Cost Control Policy',
            description: 'Budget-focused policy template with strict cost controls and approval workflows',
            category: 'Financial Policy',
            rules: 18,
            usage: 'High'
          },
          {
            name: 'Executive Travel Policy',
            description: 'Enhanced policy template for executive and senior management travel with premium allowances',
            category: 'Executive Policy',
            rules: 10,
            usage: 'Medium'
          },
          {
            name: 'Project-Based Travel',
            description: 'Policy template for project-specific travel with client billing and expense tracking',
            category: 'Project Policy',
            rules: 14,
            usage: 'Medium'
          }
        ].map((template, index) => (
          <Card key={index} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{template.name}</h4>
              <Badge variant="outline" className="text-xs">{template.category}</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{template.rules} rules included</span>
              <span>Usage: {template.usage}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary">
                Use Template
              </Button>
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Policies</h1>
          <p className="text-gray-500 mt-1">Manage travel policies, compliance rules, and policy violations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Policy Report
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Policy
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
          {[
            { id: 'policies', label: 'Policies', icon: Shield, count: travelPolicies.length },
            { id: 'compliance', label: 'Compliance', icon: CheckCircle },
            { id: 'violations', label: 'Violations', icon: AlertTriangle, count: complianceChecks.length },
            { id: 'templates', label: 'Templates', icon: FileText }
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
          {activeTab === 'policies' && renderPolicies()}
          {activeTab === 'compliance' && renderCompliance()}
          {activeTab === 'violations' && renderViolations()}
          {activeTab === 'templates' && renderTemplates()}
        </div>
      </Card>
    </div>
  )
}

export default TravelPoliciesPage