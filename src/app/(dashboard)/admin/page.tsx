'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, Building2, Briefcase, Settings, Globe, Shield, 
  FileText, Languages, Mail, Database, ChevronRight, TrendingUp,
  Calendar, Clock, DollarSign, AlertTriangle, Lock, Eye,
  BarChart3, BookOpen, Award, Zap, UserCheck, Gavel, Package, UserPlus, GraduationCap, Monitor
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useRecentAuditLogs } from '@/hooks/useAuditLogs'
import { useUsers } from '@/hooks/useUsers'
import { useEmployees } from '@/hooks/useEmployees'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useSecurityPolicies } from '@/hooks/useSecurityPolicies'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'
import { formatDistanceToNow } from 'date-fns'

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const router = useRouter()
  const { data: auditLogs = [], isLoading: logsLoading } = useRecentAuditLogs(6)
  const { data: users = [] } = useUsers()
  const { data: employees = [] } = useEmployees()
  const { data: leaveRequests = [] } = useLeaveRequests()
  const { data: securityPolicies = [] } = useSecurityPolicies()
  const { data: roleInfo } = useCurrentUserPermissions()
  const userPermissions = roleInfo?.permissions ?? []
  const can = (p: string) => userPermissions.includes(p)

  const allAdminModules = [
    {
      id: 'user-access',
      title: 'User Access & Security',
      description: 'Manage users, roles, and system security',
      icon: Shield,
      color: 'bg-red-500',
      items: ['User Management', 'Role-Based Access Control', 'Security Policies', 'Session Management', 'Two-Factor Authentication', 'Password Policies'],
      href: '/admin/user-access-security',
      requiresPermission: 'admin.user_access',
    },
    {
      id: 'organization',
      title: 'Organization Structure',
      description: 'Configure company hierarchy and locations',
      icon: Building2,
      color: 'bg-blue-500',
      href: '/admin/organization-structure',
      items: ['Company Structure', 'Locations Management', 'Location Types', 'Department Hierarchy', 'International Operations', 'Organizational Chart'],
      requiresPermission: 'admin.organization',
    },
    {
      id: 'job-management',
      title: 'Job & Position Management',
      description: 'Define job structures and compensation',
      icon: Briefcase,
      color: 'bg-green-500',
      href: '/admin/job-management',
      items: ['Job Titles', 'Job Descriptions', 'Pay Grades', 'Salary Structures', 'Employment Types', 'Job Categories', 'Career Paths'],
      requiresPermission: 'admin.job_management',
    },
    {
      id: 'employee-data',
      title: 'Employee Data Management',
      description: 'Configure employee information and PIM fields',
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/employee-data',
      items: [
        'Workforce Analytics',
        'Employee Profiles',
        'Data Management',
        'PIM Configuration',
        'Reporting Fields',
        'Data Import/Export',
        'Employee Records',
        'Generate ID',
        'Termination & Activation'
      ],
      requiresPermission: 'admin.employee_data',
    },
    {
      id: 'time-attendance',
      title: 'Time & Attendance',
      description: 'Configure time tracking and attendance policies',
      icon: Clock,
      color: 'bg-orange',
      href: '/admin/time-attendance',
      items: ['Work Schedules', 'Shift Patterns', 'Overtime Rules', 'Break Policies', 'Time Tracking Methods', 'Attendance Policies', 'Attendance Reports'],
      requiresPermission: 'admin.time_attendance',
    },
    {
      id: 'leave-management',
      title: 'Leave & Absence Management',
      description: 'Manage leave requests, approvals, types, rules and policies',
      icon: Calendar,
      color: 'bg-indigo-500',
      href: '/admin/leave-management',
      items: ['All Leave Requests', 'Leave Credit Approvals', 'Leave Types', 'Accrual Rules', 'Leave Policies', 'Leave Balances', 'Holiday Calendar', 'Absence Categories', 'Approval Workflows'],
      requiresPermission: 'admin.leave_management',
    },
    {
      id: 'payroll-benefits',
      title: 'Payroll & Benefits',
      description: 'Configure compensation and benefits',
      icon: DollarSign,
      color: 'bg-emerald-500',
      href: '/admin/payroll-benefits',
      items: ['Pay Components', 'Tax Configuration', 'Benefits Plans', 'Deductions', 'Bonus Structures', 'Reimbursements'],
      requiresPermission: 'admin.payroll_benefits',
    },
    {
      id: 'performance',
      title: 'Performance Management',
      description: 'Configure performance and goal settings',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      href: '/admin/performance',
      items: ['Review Cycles', 'Rating Scales', 'Goal Templates', 'Competency Models', 'KPI Frameworks', '360 Feedback'],
      requiresPermission: 'admin.performance',
    },
    {
      id: 'learning-development',
      title: 'Learning & Development',
      description: 'Configure training and certification programs',
      icon: BookOpen,
      color: 'bg-pink-500',
      href: '/admin/learning-development',
      items: ['Training Programs', 'Certifications', 'Skills Matrix', 'Learning Paths', 'External Training', 'Compliance Training'],
      requiresPermission: 'admin.learning',
    },
    {
      id: 'recruitment',
      title: 'Recruitment Management',
      description: 'Manage job postings, candidates, and hiring process',
      icon: UserPlus,
      color: 'bg-violet-500',
      href: '/admin/recruitment',
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
      requiresPermission: 'admin.recruitment',
    },
    {
      id: 'compliance-audit',
      title: 'Compliance & Audit',
      description: 'Manage regulatory compliance and auditing',
      icon: Gavel,
      color: 'bg-amber-500',
      href: '/admin/compliance-audit',
      items: ['Regulatory Compliance', 'Audit Trails', 'Data Retention Policies', 'Privacy Settings', 'GDPR Compliance', 'Labor Law Compliance'],
      requiresPermission: 'admin.compliance',
    },
    {
      id: 'analytics-reports',
      title: 'Analytics & Reporting',
      description: 'Configure reports and analytics dashboards',
      icon: BarChart3,
      color: 'bg-teal-500',
      href: '/admin/analytics-reports',
      items: ['Standard Reports', 'Custom Reports', 'Dashboard Configuration', 'Data Analytics', 'KPI Metrics', 'Export Settings'],
      requiresPermission: 'admin.analytics',
    },
    {
      id: 'system-config',
      title: 'System Configuration',
      description: 'Configure system settings and integrations',
      icon: Settings,
      color: 'bg-gray-600',
      href: '/admin/system-config',
      items: ['General Settings', 'Email Configuration', 'Workflow Settings', 'API Settings', 'Integration Management', 'Backup & Recovery', 'System Maintenance'],
      requiresPermission: 'admin.system_config',
    },
    {
      id: 'travel',
      title: 'Travel Management',
      description: 'Manage business travel requests, bookings, and expenses',
      icon: Globe,
      color: 'bg-blue-600',
      href: '/admin/travel',
      items: ['Travel Requests', 'Travel Booking', 'Expense Management', 'Travel Policies', 'Travel Vendor Management', 'Travel Analytics'],
      requiresPermission: 'admin.travel',
    },
    {
      id: 'asset-management',
      title: 'Asset Management',
      description: 'Track and manage company assets and equipment',
      icon: Package,
      color: 'bg-slate-600',
      href: '/admin/asset-management',
      items: ['Assets', 'Assignments', 'Maintenance', 'Requests', 'Setup', 'Reports'],
      requiresPermission: 'admin.assets',
    },
    {
      id: 'office-equipment',
      title: 'Office Equipment',
      description: 'Manage office equipment requests, assignments, and borrowed items',
      icon: Monitor,
      color: 'bg-cyan-600',
      href: '/admin/office-equipment',
      items: ['Equipment Requests', 'Borrowed Equipment', 'Equipment Assignment', 'Maintenance Records', 'Warranty Tracking'],
      requiresPermission: 'admin.assets',
    },
    {
      id: 'office-supplies',
      title: 'Office Supplies',
      description: 'Track office supplies inventory and procurement',
      icon: Package,
      color: 'bg-green-600',
      href: '/admin/office-supplies',
      items: ['Supply Inventory', 'Supply Requests', 'Purchase Orders', 'Stock Levels', 'Setup'],
      requiresPermission: 'admin.supplies',
    },
    {
      id: 'publications',
      title: 'Publications',
      description: 'Manage company publications and documents',
      icon: FileText,
      color: 'bg-purple-600',
      href: '/admin/publications',
      items: ['Publication Management', 'Add Publication', 'Printing Presses', 'Distribution Lists'],
      requiresPermission: 'admin.publications',
    },
    {
      id: 'internship-volunteer',
      title: 'Internship & Volunteer',
      description: 'Manage partner institutions, MOAs, enrollments, and certificates',
      icon: GraduationCap,
      color: 'bg-teal-600',
      href: '/admin/internship-volunteer',
      items: ['Partner Institutions', 'Enrollments', 'Hours Monitoring', 'Certificates'],
      requiresPermission: 'admin.internship',
    },
  ]

  const adminModules = allAdminModules.filter(m =>
    !m.requiresPermission || can(m.requiresPermission)
  )

  const pendingLeaveCount = leaveRequests.filter(r => r.status === 'pending').length

  // Quick Stats: Remove duplicates, clarify labels
  const quickStats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Employees', value: employees.length, icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Security Policies', value: securityPolicies.length, icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending Leave Requests', value: pendingLeaveCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Leave Requests', value: leaveRequests.length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
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
              tabIndex={0}
              aria-expanded={activeSection === module.id}
              aria-controls={`admin-section-${module.id}`}
              onClick={() => setActiveSection(activeSection === module.id ? null : module.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveSection(activeSection === module.id ? null : module.id)
                }
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
                <div
                  id={`admin-section-${module.id}`}
                  className="mt-4 pt-4 border-t border-gray-100 space-y-2"
                  role="region"
                  aria-label={`${module.title} details`}
                >
                  {module.items.map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-orange rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // For items that share a label across modules, derive
                        // route from module.href + item slug first, then fall back to flat map
                        const itemSlugMap: Record<string, string> = {
                          'Supply Inventory': 'supply-inventory',
                          'Supply Requests': 'supply-requests',
                          'Purchase Orders': 'purchase-orders',
                          'Stock Levels': 'stock-levels',
                          'Setup': 'setup',
                          'Assets': 'assets',
                          'Assignments': 'assignments',
                          'Maintenance': 'maintenance',
                          'Requests': 'requests',
                          'Reports': 'reports',
                        }
                        if (itemSlugMap[item] && (module.id === 'office-supplies' || module.id === 'asset-management')) {
                          router.push(`${module.href}/${itemSlugMap[item]}`)
                          return
                        }
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
                          'Workforce Analytics': '/admin/employee-data/workforce-analytics',
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
                          'All Leave Requests': '/admin/leave-management',
                          'Leave Types': '/admin/leave-management/leave-types',
                          'Accrual Rules': '/admin/leave-management/accrual-rules',
                          'Leave Policies': '/admin/leave-management/leave-policies',
                          'Leave Balances': '/admin/leave-management/leave-balances',
                          'Holiday Calendar': '/admin/leave-management/holiday-calendar',
                          'Absence Categories': '/admin/leave-management/absence-categories',
                          'Approval Workflows': '/admin/leave-management/approval-workflows',
                          'Leave Credit Approvals': '/admin/leave-management/credit-approvals',
                          
                          // Payroll & Benefits routes
                          'Pay Components': '/admin/payroll-benefits/pay-components',
                          'Tax Configuration': '/admin/payroll-benefits/tax-configuration',
                          'Benefits Plans': '/admin/payroll-benefits/benefits-plans',
                          'Deductions': '/admin/payroll-benefits/deductions',
                          'Bonus Structures': '/admin/payroll-benefits/bonus-structures',
                          'Reimbursements': '/admin/payroll-benefits/reimbursements',
                          
                          // Performance Management routes
                          'Review Cycles': '/admin/performance/review-cycles',
                          'Rating Scales': '/admin/performance/rating-scales',
                          'Goal Templates': '/admin/performance/goal-templates',
                          'Competency Models': '/admin/performance/competency-models',
                          'KPI Frameworks': '/admin/performance/kpi-frameworks',
                          '360 Feedback': '/admin/performance/360-feedback',
                          
                          // Learning & Development routes
                          'Training Programs': '/admin/learning-development/training-programs',
                          'Certifications': '/admin/learning-development/certifications',
                          'Skills Matrix': '/admin/learning-development/skills-matrix',
                          'Learning Paths': '/admin/learning-development/learning-paths',
                          'External Training': '/admin/learning-development/external-training',
                          'Compliance Training': '/admin/learning-development/compliance-training',
                          
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
                          'Regulatory Compliance': '/admin/compliance-audit/regulatory-compliance',
                          'Audit Trails': '/admin/compliance-audit/audit-trails',
                          'Data Retention Policies': '/admin/compliance-audit/data-retention-policies',
                          'Privacy Settings': '/admin/compliance-audit/privacy-settings',
                          'GDPR Compliance': '/admin/compliance-audit/gdpr-compliance',
                          'Labor Law Compliance': '/admin/compliance-audit/labor-law-compliance',
                          
                          // Analytics & Reporting routes
                          'Standard Reports': '/admin/analytics-reports/standard-reports',
                          'Custom Reports': '/admin/analytics-reports/custom-reports',
                          'Dashboard Configuration': '/admin/analytics-reports/dashboard-configuration',
                          'Data Analytics': '/admin/analytics-reports/data-analytics',
                          'KPI Metrics': '/admin/analytics-reports/kpi-metrics',
                          'Export Settings': '/admin/analytics-reports/export-settings',
                          
                          // System Configuration routes
                          'General Settings': '/admin/system-config/general-settings',
                          'Email Configuration': '/admin/system-config/email-configuration',
                          'Workflow Settings': '/admin/system-config/workflow-settings',
                          'API Settings': '/admin/system-config/api-settings',
                          'Integration Management': '/admin/system-config/integration-management',
                          'Backup & Recovery': '/admin/system-config/backup-recovery',
                          'System Maintenance': '/admin/system-config/system-maintenance',
                          
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
                          
                          // Office Supplies routes — handled by itemSlugMap above
                          'Supply Inventory': '/admin/office-supplies/supply-inventory',
                          'Supply Requests': '/admin/office-supplies/supply-requests',
                          'Purchase Orders': '/admin/office-supplies/purchase-orders',
                          'Stock Levels': '/admin/office-supplies/stock-levels',

                          // Office Equipment routes
                          'Equipment Requests': '/admin/office-equipment/equipment-requests',
                          'Borrowed Equipment': '/admin/office-equipment/borrowed-equipment',
                          'Equipment Assignment': '/admin/office-equipment/equipment-assignment',
                          'Maintenance Records': '/admin/office-equipment/maintenance-records',
                          'Warranty Tracking': '/admin/office-equipment/warranty-tracking',

                          // Publications routes
                          'Publication Management': '/admin/publications/publication-management',
                          'Add Publication': '/admin/publications/add-publication',
                          'Printing Presses': '/admin/publications/printing-presses',
                          'Distribution Lists': '/admin/publications/distribution-lists',

                          // Internship & Volunteer routes
                          'Partner Institutions': '/admin/internship-volunteer/partner-institutions',
                          'Enrollments': '/admin/internship-volunteer/enrollments',
                          'Hours Monitoring': '/admin/internship-volunteer/hours-monitoring',
                          'Certificates': '/admin/internship-volunteer/certificates',
                                                  }
                        const route = routeMap[item]
                        if (route) router.push(route)
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
              // Improved: prioritize action type, fallback to system
              const getActivityType = (action: string) => {
                const lowerAction = action.toLowerCase()
                if (lowerAction.includes('deleted') || lowerAction.includes('removed')) {
                  return { icon: AlertTriangle, type: 'delete' }
                } else if (lowerAction.includes('created') || lowerAction.includes('added')) {
                  return { icon: UserPlus, type: 'create' }
                } else if (lowerAction.includes('updated') || lowerAction.includes('modified')) {
                  return { icon: FileText, type: 'update' }
                } else if (lowerAction.includes('security') || lowerAction.includes('password') || lowerAction.includes('access')) {
                  return { icon: Shield, type: 'security' }
                } else if (lowerAction.includes('leave') || lowerAction.includes('policy')) {
                  return { icon: Calendar, type: 'policy' }
                } else if (lowerAction.includes('payroll') || lowerAction.includes('salary') || lowerAction.includes('compensation')) {
                  return { icon: DollarSign, type: 'financial' }
                } else if (lowerAction.includes('performance') || lowerAction.includes('review')) {
                  return { icon: TrendingUp, type: 'process' }
                } else if (lowerAction.includes('compliance') || lowerAction.includes('audit')) {
                  return { icon: Gavel, type: 'compliance' }
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
                      <p className="text-xs text-gray-400 mt-1">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>
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
            aria-label="Create User"
            onClick={() => router.push('/admin/user-access-security/user-management')}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Create User
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="Assign Role"
            onClick={() => router.push('/admin/user-access-security/rbac')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Assign Role
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="Leave Policies"
            onClick={() => router.push('/admin/leave-management')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Leave Policies
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="View Reports"
            onClick={() => router.push('/admin/analytics-reports')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="Employee Records"
            onClick={() => router.push('/admin/employee-data/employee-records')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Employee Records
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="Security Policies"
            onClick={() => router.push('/admin/user-access-security/security-policies')}
          >
            <Lock className="w-4 h-4 mr-2" />
            Security Policies
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="Data Backup"
            onClick={() => router.push('/admin/system-config/data-backup')}
          >
            <Database className="w-4 h-4 mr-2" />
            Data Backup
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            aria-label="System Config"
            onClick={() => router.push('/admin/system-config/general-settings')}
          >
            <Zap className="w-4 h-4 mr-2" />
            System Config
          </Button>
        </div>
      </Card>
    </div>
  )
}
