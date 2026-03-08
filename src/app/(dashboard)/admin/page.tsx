'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, Building2, Briefcase, Settings, Globe, Shield, 
  FileText, Languages, Mail, Database, ChevronRight, TrendingUp,
  Calendar, Clock, DollarSign, AlertTriangle, Lock, Eye,
  BarChart3, BookOpen, Award, Zap, UserCheck, Gavel, Package, UserPlus
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useRecentAuditLogs } from '@/hooks/useAuditLogs'
import { useUsers } from '@/hooks/useUsers'
import { useEmployees } from '@/hooks/useEmployees'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useSecurityPolicies } from '@/hooks/useSecurityPolicies'
import { formatDistanceToNow } from 'date-fns'

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const router = useRouter()
  const { data: auditLogs = [], isLoading: logsLoading } = useRecentAuditLogs(6)
  const { data: users = [] } = useUsers()
  const { data: employees = [] } = useEmployees()
  const { data: leaveRequests = [] } = useLeaveRequests()
  const { data: securityPolicies = [] } = useSecurityPolicies()

  const adminModules = [
    {
      id: 'user-access',
      title: 'User Access & Security',
      description: 'Manage users, roles, and system security',
      icon: Shield,
      color: 'bg-red-500',
      items: ['User Management', 'Role-Based Access Control', 'Security Policies', 'Session Management', 'Two-Factor Authentication', 'Password Policies'],
      href: '/admin/user-access-security',
    },
    {
      id: 'organization',
      title: 'Organization Structure',
      description: 'Configure company hierarchy and locations',
      icon: Building2,
      color: 'bg-blue-500',
      items: ['Company Structure', 'Locations Management', 'Location Types', 'Department Hierarchy', 'International Operations', 'Organizational Chart'],
    },
    {
      id: 'job-management',
      title: 'Job & Position Management',
      description: 'Define job structures and compensation',
      icon: Briefcase,
      color: 'bg-green-500',
      items: ['Job Titles', 'Job Descriptions', 'Pay Grades', 'Salary Structures', 'Employment Types', 'Job Categories', 'Career Paths'],
    },
    {
      id: 'employee-data',
      title: 'Employee Data Management',
      description: 'Configure employee information and PIM fields',
      icon: Users,
      color: 'bg-purple-500',
      items: [
        'Employee Profiles', 
        'Data Management', 
        'PIM Configuration', 
        'Reporting Fields', 
        'Data Import/Export', 
        'Employee Records',
        'Generate ID',
        'Termination & Activation'
      ],
    },
    {
      id: 'time-attendance',
      title: 'Time & Attendance',
      description: 'Configure time tracking and attendance policies',
      icon: Clock,
      color: 'bg-orange',
      items: ['Work Schedules', 'Shift Patterns', 'Overtime Rules', 'Break Policies', 'Time Tracking Methods', 'Attendance Policies', 'Attendance Reports'],
    },
    {
      id: 'leave-policies',
      title: 'Leave & Absence Management',
      description: 'Configure leave types and policies',
      icon: Calendar,
      color: 'bg-indigo-500',
      items: ['Leave Types', 'Accrual Rules', 'Leave Policies', 'Leave Balances', 'Holiday Calendar', 'Absence Categories', 'Approval Workflows', 'Leave Credit Approvals'],
    },
    {
      id: 'payroll-benefits',
      title: 'Payroll & Benefits',
      description: 'Configure compensation and benefits',
      icon: DollarSign,
      color: 'bg-emerald-500',
      items: ['Pay Components', 'Tax Configuration', 'Benefits Plans', 'Deductions', 'Bonus Structures', 'Reimbursements'],
    },
    {
      id: 'performance',
      title: 'Performance Management',
      description: 'Configure performance and goal settings',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      items: ['Review Cycles', 'Rating Scales', 'Goal Templates', 'Competency Models', 'KPI Frameworks', '360 Feedback'],
    },
    {
      id: 'learning-development',
      title: 'Learning & Development',
      description: 'Configure training and certification programs',
      icon: BookOpen,
      color: 'bg-pink-500',
      items: ['Training Programs', 'Certifications', 'Skills Matrix', 'Learning Paths', 'External Training', 'Compliance Training'],
    },
    {
      id: 'recruitment',
      title: 'Recruitment Management',
      description: 'Manage job postings, candidates, and hiring process',
      icon: UserPlus,
      color: 'bg-violet-500',
      items: [
        'Job Postings',
        'Candidate Management',
        'Application Tracking',
        'Interview Scheduling',
        'Candidate Pipeline',
        'Hiring Workflows',
        'Offer Management',
        'Onboarding Process',
        'Recruitment Analytics',
        'Job Boards Integration',
        'Talent Pool',
        'Screening Questions'
      ],
    },
    {
      id: 'compliance-audit',
      title: 'Compliance & Audit',
      description: 'Manage regulatory compliance and auditing',
      icon: Gavel,
      color: 'bg-amber-500',
      items: ['Regulatory Compliance', 'Audit Trails', 'Data Retention Policies', 'Privacy Settings', 'GDPR Compliance', 'Labor Law Compliance'],
    },
    {
      id: 'analytics-reports',
      title: 'Analytics & Reporting',
      description: 'Configure reports and analytics dashboards',
      icon: BarChart3,
      color: 'bg-teal-500',
      items: ['Standard Reports', 'Custom Reports', 'Dashboard Configuration', 'Data Analytics', 'KPI Metrics', 'Export Settings'],
    },
    {
      id: 'system-config',
      title: 'System Configuration',
      description: 'Configure system settings and integrations',
      icon: Settings,
      color: 'bg-gray-600',
      items: ['General Settings', 'Email Configuration', 'API Settings', 'Integration Management', 'Backup & Recovery', 'System Maintenance'],
    },
    {
      id: 'travel',
      title: 'Travel Management',
      description: 'Manage business travel requests, bookings, and expenses',
      icon: Globe,
      color: 'bg-blue-600',
      items: ['Travel Requests', 'Travel Booking', 'Expense Management', 'Travel Policies', 'Travel Vendor Management', 'Travel Analytics'],
    },
    {
      id: 'asset-management',
      title: 'Asset Management',
      description: 'Track and manage company assets and equipment',
      icon: Package,
      color: 'bg-slate-600',
      items: ['Assets', 'Assignments', 'Maintenance', 'Requests', 'Setup', 'Reports'],
    },
    {
      id: 'office-supplies',
      title: 'Office Supplies',
      description: 'Track office supplies inventory and procurement',
      icon: Package,
      color: 'bg-green-600',
      items: ['Supply Inventory', 'Supply Requests', 'Vendor Management', 'Purchase Orders', 'Stock Levels', 'Supply Categories'],
    },
    {
      id: 'publications',
      title: 'Publications',
      description: 'Manage company publications and documents',
      icon: FileText,
      color: 'bg-purple-600',
      items: ['Publication Management', 'Add Publication', 'Printing Presses', 'Distribution Lists'],
    },
  ]

  const pendingLeaveCount = leaveRequests.filter(r => r.status === 'pending').length

  const quickStats = [
    { label: 'Total Users', value: users.length || employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Policies', value: securityPolicies.length, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Leave', value: pendingLeaveCount, icon: AlertTriangle, color: 'text-orange', bg: 'bg-orange/10' },
    { label: 'Security Policies', value: securityPolicies.length, icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Employees', value: employees.length, icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Leave Requests', value: leaveRequests.length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <p className="text-gray-500 mt-1">System administration and configuration</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* System Health Monitor */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange" />
          System Health Monitor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Database</span>
            </div>
            <p className="text-xs text-green-600">Response: 45ms</p>
            <p className="text-xs text-green-600">Uptime: 99.98%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">API Services</span>
            </div>
            <p className="text-xs text-green-600">Response: 125ms</p>
            <p className="text-xs text-green-600">Success Rate: 99.9%</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-800">Storage</span>
            </div>
            <p className="text-xs text-yellow-600">Used: 78% (523GB)</p>
            <p className="text-xs text-yellow-600">Free: 22% (147GB)</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Memory</span>
            </div>
            <p className="text-xs text-blue-600">Used: 62% (4.9GB)</p>
            <p className="text-xs text-blue-600">Available: 38% (3.1GB)</p>
          </div>
        </div>
      </Card>

      {/* Admin Modules */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => (
            <Card 
              key={module.id} 
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                activeSection === module.id ? 'ring-2 ring-orange' : ''
              }`}
              onClick={() => {
                setActiveSection(activeSection === module.id ? null : module.id)
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                  activeSection === module.id ? 'rotate-90' : ''
                }`} />
              </div>

              {activeSection === module.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {module.items.map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-orange rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('Clicked item:', item)
                        // Handle navigation to specific admin module
                        const routeMap: Record<string, string> = {
                          // User Access & Security routes
                          'User Management': '/admin/user-access-security/user-management',
                          'Role-Based Access Control': '/admin/user-access-security/rbac',
                          'Security Policies': '/admin/user-access-security/security-policies',
                          'Session Management': '/admin/user-access-security/session-management',
                          'Two-Factor Authentication': '/admin/user-access-security/two-factor',
                          'Password Policies': '/admin/user-access-security/password-policies',
                          
                          // Organization Structure routes
                          'Company Structure': '/admin/organization-structure/company-structure',
                          'Locations Management': '/admin/organization-structure/locations-management',
                          'Location Types': '/admin/organization-structure/location-types',
                          'Department Hierarchy': '/admin/organization-structure/department-hierarchy',
                          'International Operations': '/admin/organization-structure/international-operations',
                          'Organizational Chart': '/admin/organization-structure/organizational-chart',
                          
                          // Job & Position Management routes
                          'Job Titles': '/admin/job-management/job-titles',
                          'Job Descriptions': '/admin/job-management/job-descriptions',
                          'Pay Grades': '/admin/job-management/pay-grades',
                          'Salary Structures': '/admin/job-management/salary-structures',
                          'Employment Types': '/admin/job-management/employment-types',
                          'Job Categories': '/admin/job-management/job-categories',
                          'Career Paths': '/admin/job-management/career-paths',
                          
                          // Employee Data Management routes
                          'Employee Profiles': '/admin/employee-data/employee-profiles',
                          'Data Management': '/admin/employee-data/data-management',
                          'PIM Configuration': '/admin/employee-data/pim-configuration',
                          'Reporting Fields': '/admin/employee-data/reporting-fields',
                          'Data Import/Export': '/admin/employee-data/data-import-export',
                          'Employee Records': '/admin/employee-data/employee-records',
                          'Generate ID': '/generate-id',
                          'Termination & Activation': '/admin/employee-data/termination-activation',
                          
                          // Time & Attendance routes
                          'Work Schedules': '/admin/time-attendance/work-schedules',
                          'Shift Patterns': '/admin/time-attendance/shift-patterns',
                          'Overtime Rules': '/admin/time-attendance/overtime-rules',
                          'Break Policies': '/admin/time-attendance/break-policies',
                          'Time Tracking Methods': '/admin/time-attendance/time-tracking-methods',
                          'Attendance Policies': '/admin/time-attendance/attendance-policies',
                          'Attendance Reports': '/admin/time-attendance/reports',
                          
                          // Leave & Absence Management routes
                          'Leave Types': '/admin/leave-policies/leave-types',
                          'Accrual Rules': '/admin/leave-policies/accrual-rules',
                          'Leave Policies': '/admin/leave-policies/leave-policies',
                          'Leave Balances': '/admin/leave-policies/leave-balances',
                          'Holiday Calendar': '/admin/leave-policies/holiday-calendar',
                          'Absence Categories': '/admin/leave-policies/absence-categories',
                          'Approval Workflows': '/admin/leave-policies/approval-workflows',
                          'Leave Credit Approvals': '/admin/leave-management/credit-approvals',
                          
                          // Payroll & Benefits routes
                          'Pay Components': '/admin/payroll-benefits',
                          'Tax Configuration': '/admin/payroll-benefits',
                          'Benefits Plans': '/admin/payroll-benefits',
                          'Deductions': '/admin/payroll-benefits',
                          'Bonus Structures': '/admin/payroll-benefits',
                          'Reimbursements': '/admin/payroll-benefits',
                          
                          // Performance Management routes
                          'Review Cycles': '/admin/performance',
                          'Rating Scales': '/admin/performance',
                          'Goal Templates': '/admin/performance',
                          'Competency Models': '/admin/performance',
                          'KPI Frameworks': '/admin/performance',
                          '360 Feedback': '/admin/performance',
                          
                          // Learning & Development routes
                          'Training Programs': '/admin/learning-development',
                          'Certifications': '/admin/learning-development',
                          'Skills Matrix': '/admin/learning-development',
                          'Learning Paths': '/admin/learning-development',
                          'External Training': '/admin/learning-development',
                          'Compliance Training': '/admin/learning-development',
                          
                          // Recruitment Management routes
                          'Job Postings': '/admin/recruitment/job-postings',
                          'Candidate Management': '/admin/recruitment/candidate-management',
                          'Application Tracking': '/admin/recruitment/application-tracking',
                          'Interview Scheduling': '/admin/recruitment/interview-scheduling',
                          'Candidate Pipeline': '/admin/recruitment/candidate-pipeline',
                          'Hiring Workflows': '/admin/recruitment/hiring-workflows',
                          'Offer Management': '/admin/recruitment/offer-management',
                          'Onboarding Process': '/admin/recruitment/onboarding-process',
                          'Recruitment Analytics': '/admin/recruitment/recruitment-analytics',
                          'Job Boards Integration': '/admin/recruitment/job-boards-integration',
                          'Talent Pool': '/admin/recruitment/talent-pool',
                          'Screening Questions': '/admin/recruitment/screening-questions',
                          
                          // Compliance & Audit routes
                          'Regulatory Compliance': '/admin/compliance-audit',
                          'Audit Trails': '/admin/compliance-audit',
                          'Data Retention Policies': '/admin/compliance-audit',
                          'Privacy Settings': '/admin/compliance-audit',
                          'GDPR Compliance': '/admin/compliance-audit',
                          'Labor Law Compliance': '/admin/compliance-audit',
                          
                          // Analytics & Reporting routes
                          'Standard Reports': '/admin/analytics-reporting',
                          'Custom Reports': '/admin/analytics-reporting',
                          'Dashboard Configuration': '/admin/analytics-reporting',
                          'Data Analytics': '/admin/analytics-reporting',
                          'KPI Metrics': '/admin/analytics-reporting',
                          'Export Settings': '/admin/analytics-reporting',
                          
                          // System Configuration routes
                          'General Settings': '/admin/system-configuration',
                          'Email Configuration': '/admin/system-configuration',
                          'API Settings': '/admin/system-configuration',
                          'Integration Management': '/admin/system-configuration',
                          'Backup & Recovery': '/admin/system-configuration',
                          'System Maintenance': '/admin/system-configuration',
                          
                          // Travel Management routes
                          'Travel Requests': '/admin/travel/travel-requests',
                          'Travel Booking': '/admin/travel/travel-booking',
                          'Expense Management': '/admin/travel/expense-management',
                          'Travel Policies': '/admin/travel/travel-policies',
                          'Travel Vendor Management': '/admin/travel/vendor-management',
                          'Travel Analytics': '/admin/travel/travel-analytics',
                          
                          // Asset Management routes
                          'Assets': '/admin/asset-management/assets',
                          'Assignments': '/admin/asset-management/assignments',
                          'Maintenance': '/admin/asset-management/maintenance',
                          'Requests': '/admin/asset-management/requests',
                          'Setup': '/admin/asset-management/setup',
                          'Reports': '/admin/asset-management/reports',
                          
                          // Office Supplies routes
                          'Supply Inventory': '/admin/office-supplies/supply-inventory',
                          'Supply Requests': '/admin/office-supplies/supply-requests',
                          'Vendor Management': '/admin/office-supplies/vendor-management',
                          'Purchase Orders': '/admin/office-supplies/purchase-orders',
                          'Stock Levels': '/admin/office-supplies/stock-levels',
                          'Supply Categories': '/admin/office-supplies/supply-categories',

                          // Publications routes
                          'Publication Management': '/admin/publications/publication-management',
                          'Add Publication': '/admin/publications/add-publication',
                          'Printing Presses': '/admin/publications/printing-presses',
                          'Distribution Lists': '/admin/publications/distribution-lists',
                                                  }
                        const route = routeMap[item]
                        if (route) {
                          router.push(route)
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Admin Activity</h3>
        {logsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading activity...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No recent activity</div>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => {
              // Determine icon and color based on action
              const getActivityType = (action: string) => {
                const lowerAction = action.toLowerCase()
                if (lowerAction.includes('security') || lowerAction.includes('password') || lowerAction.includes('access')) {
                  return { icon: Shield, type: 'security' }
                } else if (lowerAction.includes('leave') || lowerAction.includes('policy')) {
                  return { icon: Calendar, type: 'policy' }
                } else if (lowerAction.includes('payroll') || lowerAction.includes('salary') || lowerAction.includes('compensation')) {
                  return { icon: DollarSign, type: 'financial' }
                } else if (lowerAction.includes('performance') || lowerAction.includes('review')) {
                  return { icon: TrendingUp, type: 'process' }
                } else if (lowerAction.includes('compliance') || lowerAction.includes('audit')) {
                  return { icon: Gavel, type: 'compliance' }
                } else if (lowerAction.includes('created') || lowerAction.includes('added')) {
                  return { icon: UserPlus, type: 'create' }
                } else if (lowerAction.includes('updated') || lowerAction.includes('modified')) {
                  return { icon: FileText, type: 'update' }
                } else if (lowerAction.includes('deleted') || lowerAction.includes('removed')) {
                  return { icon: AlertTriangle, type: 'delete' }
                }
                return { icon: Database, type: 'system' }
              }

              const { icon: Icon, type } = getActivityType(log.action)

              const typeColors: Record<string, string> = {
                security: 'bg-red-50 text-red-600',
                policy: 'bg-blue-50 text-blue-600', 
                financial: 'bg-green-50 text-green-600',
                process: 'bg-purple-50 text-purple-600',
                compliance: 'bg-amber-50 text-amber-600',
                system: 'bg-gray-50 text-gray-600',
                create: 'bg-emerald-50 text-emerald-600',
                update: 'bg-indigo-50 text-indigo-600',
                delete: 'bg-orange-50 text-orange-600',
              }
              const colorClass = typeColors[type] || 'bg-gray-50 text-gray-600'

              const employeeName = log.employee 
                ? `${log.employee.first_name} ${log.employee.last_name}`
                : 'Unknown Employee'

              const timeAgo = log.created_at 
                ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
                : 'Unknown time'

              return (
                <div key={log.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg ${colorClass.split(' ')[0]}`}>
                    <Icon className={`w-4 h-4 ${colorClass.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">
                      by {log.changed_by} • {employeeName}
                    </p>
                    {log.details && (
                      <p className="text-xs text-gray-400 mt-1">{log.details}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{timeAgo}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/user-access-security/user-management')}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Create User
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/user-access-security/rbac')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Assign Role
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/leave-policies')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Leave Policies
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/reports-analytics')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/employee-data/employee-records')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Employee Records
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/user-access-security/security-policies')}
          >
            <Lock className="w-4 h-4 mr-2" />
            Security Policies
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/data-privacy/data-backup')}
          >
            <Database className="w-4 h-4 mr-2" />
            Data Backup
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/admin/system-config/system-preferences')}
          >
            <Zap className="w-4 h-4 mr-2" />
            System Config
          </Button>
        </div>
      </Card>
    </div>
  )
}
