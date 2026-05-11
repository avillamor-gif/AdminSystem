'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, Briefcase, User, Users, CreditCard, Shield, Award, FileText, Heart, Plane, Laptop, GraduationCap, Lock, Save, Paperclip, Upload, Download, Trash2, Edit, Eye, Camera, RotateCcw, Package, PenLine, UsersRound } from 'lucide-react'
import { Card, Avatar, Badge, Button, Input, Select } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { useEmployeeByEmployeeId, useUpdateEmployee, useEmployees, useCurrentEmployee, employeeKeys } from '@/hooks/useEmployees'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'
import { useJobTitles } from '@/hooks/useJobTitles'
import { useJobDescriptions } from '@/hooks/useJobDescriptions'
import { useEmploymentTypes } from '@/hooks/useEmploymentTypes'
import { useLocations } from '@/hooks/useLocations'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmergencyContacts, useDeleteEmergencyContact } from '@/hooks/useEmergencyContacts'
import { useContractDocuments, useUploadContractDocument, useDeleteContractDocument, useDownloadContractDocument } from '@/hooks/useContractDocuments'
import { useEmployeeAttachments, useUploadEmployeeAttachment, useDeleteEmployeeAttachment, useDownloadEmployeeAttachment } from '@/hooks/useEmployeeAttachments'
import { useAssets, useAssetAssignments, useAssignAsset, useReturnAsset, type Asset } from '@/hooks/useAssets'
import { useImmigrationDocuments, useCreateImmigrationDocument, useUpdateImmigrationDocument, useDeleteImmigrationDocument, type ImmigrationDocument } from '@/hooks/useImmigration'
import { EmergencyContactFormModal } from './EmergencyContactFormModal'
import { SignatureTab } from './SignatureTab'
import { uploadEmployeePhoto, deleteEmployeePhoto } from '@/lib/supabase/storage'
import { useEmployeeCommittees } from '@/hooks/useCommittees'
import { logAction } from '@/services/auditLog.service'
import { useMyBenefitsEnrollments, useMyBereavementClaims, useCreateBereavementClaim } from '@/hooks'
import type { BereavementRelationship, BereavementClaimStatus } from '@/services'
import { toast } from 'sonner'

const BERE_STATUS_COLORS: Record<BereavementClaimStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}
const BERE_REL_LABELS: Record<BereavementRelationship, string> = {
  parent: 'Parent', sibling: 'Sibling', spouse: 'Spouse', child: 'Child', other: 'Other',
}

function BenefitsTabContent({ employeeId, selfService }: { employeeId: string; selfService: boolean }) {
  const { data: enrollments = [] } = useMyBenefitsEnrollments(employeeId)
  const { data: claims = [] } = useMyBereavementClaims(employeeId)
  const createMutation = useCreateBereavementClaim()

  const [showClaimForm, setShowClaimForm] = useState(false)
  const [deceasedName, setDeceasedName] = useState('')
  const [relationship, setRelationship] = useState<BereavementRelationship>('parent')
  const [dateOfDeath, setDateOfDeath] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmitClaim = async () => {
    if (!deceasedName || !dateOfDeath) return
    await createMutation.mutateAsync({
      employee_id: employeeId,
      deceased_name: deceasedName,
      relationship,
      date_of_death: dateOfDeath,
      amount: 15000,
      notes: notes || null,
      requested_by: employeeId,
    })
    setShowClaimForm(false)
    setDeceasedName(''); setDateOfDeath(''); setNotes('')
    toast.success('Bereavement claim submitted.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-orange/10 rounded-lg">
          <Shield className="w-5 h-5 text-orange" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Benefits & Insurance</h3>
          <p className="text-sm text-gray-500">Health insurance, retirement plans, and bereavement assistance</p>
        </div>
      </div>
      <div className="border-t border-gray-200" />

      {/* Enrollments */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Benefit Enrollments</h4>
        {(enrollments as any[]).length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">No active enrollments on file. Contact HR.</div>
        ) : (
          <div className="space-y-2">
            {(enrollments as any[]).map((e: any) => (
              <div key={e.id} className={`flex items-center justify-between p-3 rounded-lg border ${e.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{e.plan?.plan_name ?? '—'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Coverage: {e.coverage_type ?? '—'} · Employee share: ₱{e.employee_share?.toLocaleString() ?? '0'}/mo
                  </div>
                  <div className="text-xs text-gray-400">Enrolled {formatDate(e.enrollment_date)}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {e.is_active ? 'Active' : 'Ended'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bereavement */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Bereavement Assistance (₱15,000)</h4>
          {selfService && !showClaimForm && (
            <Button variant="secondary" onClick={() => setShowClaimForm(true)}>+ File a Claim</Button>
          )}
        </div>

        {showClaimForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3 bg-gray-50">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
              IBON provides <strong>₱15,000</strong> for death of a parent, sibling, spouse, or child.
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deceased Name *</label>
              <input type="text" value={deceasedName} onChange={e => setDeceasedName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Relationship *</label>
                <select value={relationship} onChange={e => setRelationship(e.target.value as BereavementRelationship)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(BERE_REL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Death *</label>
                <input type="date" value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSubmitClaim}
                disabled={!deceasedName || !dateOfDeath || createMutation.isPending}>
                {createMutation.isPending ? 'Submitting…' : 'Submit Claim'}
              </Button>
              <Button variant="secondary" onClick={() => setShowClaimForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {(claims as any[]).length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg">No bereavement claims on file.</div>
        ) : (
          <div className="space-y-2">
            {(claims as any[]).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">{c.deceased_name}</div>
                  <div className="text-xs text-gray-500">{BERE_REL_LABELS[c.relationship as BereavementRelationship]} · {formatDate(c.date_of_death)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">₱{c.amount.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BERE_STATUS_COLORS[c.status as BereavementClaimStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Committees sub-component (defined outside to avoid re-mount) ───────────────
function EmployeeCommitteesTab({ employeeId }: { employeeId: string }) {
  const { data: memberships = [], isLoading } = useEmployeeCommittees(employeeId)

  const ROLE_COLORS: Record<string, string> = {
    chair:     'bg-orange-100 text-orange-700',
    secretary: 'bg-blue-100 text-blue-700',
    member:    'bg-gray-100 text-gray-600',
  }
  const TYPE_LABELS: Record<string, string> = {
    standing:  'Standing',
    ad_hoc:    'Ad Hoc',
    technical: 'Technical',
    advisory:  'Advisory',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange/10 rounded-lg">
            <UsersRound className="w-5 h-5 text-orange" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Committee Memberships</h3>
            <p className="text-sm text-gray-500 mt-1">Committees this employee is part of</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange border-t-transparent" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <UsersRound className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Not a member of any committee</p>
          <p className="text-sm text-gray-400 mt-1">
            Assign committees via <strong>Admin → Organization Structure → Committees</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memberships.map(c => {
            const myMembership = c.members[0]
            return (
              <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <UsersRound className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[c.type] ?? c.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {myMembership && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${ROLE_COLORS[myMembership.role]}`}>
                      {myMembership.role === 'chair' ? 'Chairperson' : myMembership.role === 'secretary' ? 'Secretary' : 'Member'}
                    </span>
                  )}
                  {!c.is_active && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">Inactive</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type TabKey = 'personal' | 'contact' | 'employment' | 'emergency' | 'dependents' | 'banking' | 'benefits' | 'immigration' | 'assets' | 'qualifications' | 'security' | 'signature' | 'committees'

export function EmployeeDetailContent({
  backHref = '/employees',
  overrideEmployeeId,
  hideBackButton = false,
  readOnly = false,
  selfService = false,
}: {
  backHref?: string
  overrideEmployeeId?: string
  hideBackButton?: boolean
  readOnly?: boolean
  selfService?: boolean
}) {
  const params = useParams()
  const router = useRouter()
  const employeeId = overrideEmployeeId ?? (params.id as string)
  const [activeTab, setActiveTab] = useState<TabKey>('personal')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEmergencyContactModalOpen, setIsEmergencyContactModalOpen] = useState(false)
  const [selectedEmergencyContact, setSelectedEmergencyContact] = useState<any>(undefined)
  const [includeContractDetails, setIncludeContractDetails] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  
  // Form state for Personal Information
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    date_of_birth: '',
    sex: '',
    marital_status: '',
    nationality: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    // Government IDs
    national_id: '',
    voters_id: '',
    pagibig_number: '',
    philhealth_number: '',
    sss_number: '',
    tin_number: '',
  })

  // Form state for Contact Information
  const [contactFormData, setContactFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    phone: '',
    email: '',
    work_phone: '',
    mobile_phone: '',
    home_phone: '',
    work_email: '',
    personal_email: '',
  })

  // Form state for Employment Details
  const [employmentFormData, setEmploymentFormData] = useState({
    hire_date: '',
    job_title_id: '',
    employment_type_id: '',
    location_id: '',
    job_specification_id: '',
    manager_id: '',
    department_id: '',
    work_location_type: '',
    remote_location: '',
    status: 'active',
    contract_start_date: '',
    contract_end_date: '',
  })
  
  // Fetch employee by employee_id
  const { data: employee, isLoading, error } = useEmployeeByEmployeeId(employeeId)
  const queryClient = useQueryClient()
  const updateEmployee = useUpdateEmployee()
  const { data: roleInfo } = useCurrentUserPermissions()
  const { data: jobTitles = [] } = useJobTitles({})
  const { data: jobDescriptions = [] } = useJobDescriptions({})
  const { data: employmentTypes = [] } = useEmploymentTypes({})
  const { data: locations = [] } = useLocations({ status: 'active' })
  const { data: departments = [] } = useDepartments()
  const { data: allEmployees = [] } = useEmployees({ status: 'active' })
  const { data: emergencyContacts = [], isLoading: isLoadingContacts } = useEmergencyContacts(employee?.id || '')
  const deleteEmergencyContact = useDeleteEmergencyContact()
  const { data: contractDocuments = [], isLoading: isLoadingContracts } = useContractDocuments(employee?.id || '')
  const uploadContractDocument = useUploadContractDocument()
  const deleteContractDocument = useDeleteContractDocument()
  const downloadContractDocument = useDownloadContractDocument()
  const { data: employeeAttachments = [], isLoading: isLoadingAttachments } = useEmployeeAttachments(employee?.id || '')
  const uploadEmployeeAttachment = useUploadEmployeeAttachment()
  const deleteEmployeeAttachment = useDeleteEmployeeAttachment()
  const downloadEmployeeAttachment = useDownloadEmployeeAttachment()
  // Asset hooks
  const { data: currentEmployee } = useCurrentEmployee()
  const { data: assignedAssets = [], isLoading: isLoadingAssets } = useAssets(
    employee?.id ? { assigned_to: employee.id } : undefined
  )
  const { data: assetAssignments = [], isLoading: isLoadingAssignments } = useAssetAssignments(
    employee?.id ? { employee_id: employee.id, is_active: true } : undefined
  )
  const { data: availableAssets = [] } = useAssets({ status: 'available' })
  const assignAsset = useAssignAsset()
  const returnAsset = useReturnAsset()
  // Asset modal state
  const [isAssignAssetModalOpen, setIsAssignAssetModalOpen] = useState(false)
  const [isReturnAssetModalOpen, setIsReturnAssetModalOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [selectedAssetIdToAssign, setSelectedAssetIdToAssign] = useState('')
  const [assignCondition, setAssignCondition] = useState('')
  const [returnCondition, setReturnCondition] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  // Immigration state
  const { data: immigrationDocuments = [], isLoading: isLoadingImmigration } = useImmigrationDocuments(employee?.id || '')
  const createImmigrationDoc = useCreateImmigrationDocument()
  const updateImmigrationDoc = useUpdateImmigrationDocument()
  const deleteImmigrationDoc = useDeleteImmigrationDocument()
  const [isImmigrationModalOpen, setIsImmigrationModalOpen] = useState(false)
  const [editingImmigrationDoc, setEditingImmigrationDoc] = useState<ImmigrationDocument | null>(null)
  const [immigrationForm, setImmigrationForm] = useState({
    document_type: 'passport' as 'passport' | 'visa',
    document_number: '',
    issued_date: '',
    expiry_date: '',
    eligible_status: '',
    issued_by: '',
    eligible_review_date: '',
    comments: '',
  })
  const isAdmin = roleInfo?.permissions?.includes('employee.edit') ?? false
  // In self-service mode (My Info), employees can edit their own personal/contact/emergency data
  const canSelfEdit = isAdmin || selfService

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error('Error loading employee:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    }
  }, [error])

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Employee</h3>
          <pre className="text-sm text-red-600 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    )
  }

  // Update form data when employee data loads
  useEffect(() => {
    if (employee) {
      const emp = employee as any
      setFormData({
        first_name: emp.first_name || '',
        middle_name: emp.middle_name || '',
        last_name: emp.last_name || '',
        suffix: emp.suffix || '',
        date_of_birth: emp.date_of_birth || '',
        sex: emp.sex || '',
        marital_status: emp.marital_status || '',
        nationality: emp.nationality || '',
        phone: emp.phone || '',
        address: emp.address || '',
        city: emp.city || '',
        country: emp.country || '',
        national_id: emp.national_id || '',
        voters_id: emp.voters_id || '',
        pagibig_number: emp.pagibig_number || '',
        philhealth_number: emp.philhealth_number || '',
        sss_number: emp.sss_number || '',
        tin_number: emp.tin_number || '',
      })
      setContactFormData({
        address: emp.address || '',
        city: emp.city || '',
        state: emp.state || '',
        zip_code: emp.zip_code || '',
        country: emp.country || '',
        phone: emp.phone || '',
        email: emp.email || '',
        work_phone: emp.work_phone || '',
        mobile_phone: emp.mobile_phone || '',
        home_phone: emp.home_phone || '',
        work_email: emp.work_email || emp.email || '',
        personal_email: emp.personal_email || '',
      })
      setEmploymentFormData({
        hire_date: emp.hire_date || '',
        job_title_id: emp.job_title_id || '',
        employment_type_id: emp.employment_type_id || '',
        location_id: emp.location_id || '',
        job_specification_id: emp.job_specification_id || '',
        manager_id: emp.manager_id || '',
        department_id: emp.department_id || '',
        work_location_type: emp.work_location_type || '',
        remote_location: emp.remote_location || '',
        status: emp.status || 'active',
        contract_start_date: emp.contract_start_date || '',
        contract_end_date: emp.contract_end_date || '',
      })
      if (emp.contract_start_date || emp.contract_end_date) {
        setIncludeContractDetails(true)
      }
    }
  }, [employee])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContactInputChange = (field: string, value: string) => {
    setContactFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmploymentInputChange = (field: string, value: string) => {
    setEmploymentFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!employee) return

    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: {
          first_name: formData.first_name,
          middle_name: formData.middle_name || null,
          last_name: formData.last_name,
          suffix: formData.suffix || null,
          date_of_birth: formData.date_of_birth || null,
          sex: formData.sex || null,
          marital_status: formData.marital_status || null,
          nationality: formData.nationality || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          national_id: formData.national_id || null,
          voters_id: formData.voters_id || null,
          pagibig_number: formData.pagibig_number || null,
          philhealth_number: formData.philhealth_number || null,
          sss_number: formData.sss_number || null,
          tin_number: formData.tin_number || null,
        } as any
      })
      setIsEditMode(false)
      await logAction({
        employee_id: employee.id,
        action: 'Personal Info Updated',
        details: `Updated personal information for ${employee.first_name} ${employee.last_name}`,
      })
      toast.success('Employee details updated successfully')
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error('Failed to update employee details')
    }
  }

  const handleContactSave = async () => {
    if (!employee) return

    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: {
          address: contactFormData.address || null,
          city: contactFormData.city || null,
          state: contactFormData.state || null,
          zip_code: contactFormData.zip_code || null,
          country: contactFormData.country || null,
          phone: contactFormData.phone || null,
          email: contactFormData.email || null,
          work_phone: contactFormData.work_phone || null,
          mobile_phone: contactFormData.mobile_phone || null,
          home_phone: contactFormData.home_phone || null,
          work_email: contactFormData.work_email || null,
          personal_email: contactFormData.personal_email || null,
        } as any
      })
      setIsEditMode(false)
      await logAction({
        employee_id: employee.id,
        action: 'Contact Info Updated',
        details: `Updated contact information for ${employee.first_name} ${employee.last_name}`,
      })
      toast.success('Contact information updated successfully')
    } catch (error) {
      console.error('Error updating contact information:', error)
      toast.error('Failed to update contact information')
    }
  }

  const handleEmploymentSave = async () => {
    if (!employee) return

    try {
      // Clean up the data - convert empty strings to null for UUID fields
      const cleanData = {
        hire_date: employmentFormData.hire_date || null,
        job_title_id: employmentFormData.job_title_id && employmentFormData.job_title_id !== '' ? employmentFormData.job_title_id : null,
        employment_type_id: employmentFormData.employment_type_id && employmentFormData.employment_type_id !== '' ? employmentFormData.employment_type_id : null,
        location_id: employmentFormData.location_id && employmentFormData.location_id !== '' ? employmentFormData.location_id : null,
        job_specification_id: employmentFormData.job_specification_id && employmentFormData.job_specification_id !== '' ? employmentFormData.job_specification_id : null,
        manager_id: employmentFormData.manager_id && employmentFormData.manager_id !== '' ? employmentFormData.manager_id : null,
        department_id: employmentFormData.department_id && employmentFormData.department_id !== '' ? employmentFormData.department_id : null,
        work_location_type: employmentFormData.work_location_type || null,
        remote_location: employmentFormData.remote_location || null,
        status: (employmentFormData.status || 'active') as 'active' | 'inactive' | 'terminated',
        contract_start_date: includeContractDetails ? (employmentFormData.contract_start_date || null) : null,
        contract_end_date: includeContractDetails ? (employmentFormData.contract_end_date || null) : null,
      }
      
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: cleanData as any
      })
      setIsEditMode(false)
      await logAction({
        employee_id: employee.id,
        action: 'Employment Details Updated',
        details: `Updated employment details for ${employee.first_name} ${employee.last_name}`,
      })
      toast.success('Employment details updated successfully')
    } catch (error) {
      console.error('Error updating employment details:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error('Failed to update employment details')
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !employee) return

    const file = event.target.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setIsUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('employeeId', employee.employee_id)

      const res = await fetch(`/api/employees/${employee.id}/photo`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Upload failed')
      }

      // Refresh employee data in cache
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all })

      toast.success('Photo uploaded successfully')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handlePhotoDelete = async () => {
    if (!employee?.avatar_url) return

    if (!confirm('Are you sure you want to delete this photo?')) return

    setIsUploadingPhoto(true)

    try {
      const res = await fetch(`/api/employees/${employee.id}/photo`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Delete failed')
      }

      // Refresh employee data in cache
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all })

      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const tabs = [
    { key: 'personal' as TabKey, label: 'Personal Details', icon: User },
    { key: 'contact' as TabKey, label: 'Contact Information', icon: Phone },
    { key: 'employment' as TabKey, label: 'Employment Details', icon: Briefcase },
    { key: 'emergency' as TabKey, label: 'Emergency Contacts', icon: Heart },
    { key: 'dependents' as TabKey, label: 'Dependents', icon: Users },
    { key: 'banking' as TabKey, label: 'Banking & Payroll', icon: CreditCard },
    { key: 'benefits' as TabKey, label: 'Benefits & Insurance', icon: Shield },
    { key: 'immigration' as TabKey, label: 'Immigration', icon: Plane },
    { key: 'assets' as TabKey, label: 'Assets & Equipment', icon: Laptop },
    { key: 'qualifications' as TabKey, label: 'Qualifications', icon: GraduationCap },
    { key: 'security' as TabKey, label: 'Security & Privacy', icon: Lock },
    { key: 'signature' as TabKey, label: 'E-Signature', icon: PenLine },
    { key: 'committees' as TabKey, label: 'Committees', icon: UsersRound },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
      </div>
    )
  }

  if (error || !employee) {
    const errorMessage = error 
      ? ((error as Error) instanceof Error ? (error as Error).message : JSON.stringify(error))
      : 'Employee not found'
    
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{errorMessage}</p>
        <Link href={backHref} className="text-orange hover:underline mt-2 inline-block">
          Back to employees
        </Link>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      active: 'success',
      inactive: 'warning',
      terminated: 'danger',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <User className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500 mt-1">Basic personal information and demographics</p>
                </div>
              </div>
              {!readOnly && (
              <Button 
                variant={isEditMode ? 'primary' : 'secondary'} 
                size="sm"
                onClick={() => isEditMode ? handleSave() : setIsEditMode(true)}
                loading={updateEmployee.isPending}
              >
                {isEditMode ? <><Save className="w-4 h-4 mr-2" /> Save</> : 'Edit'}
              </Button>
              )}
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1fr_1fr_120px] gap-4">
                <Input 
                  label="First Name" 
                  value={formData.first_name} 
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Middle Name" 
                  value={formData.middle_name} 
                  onChange={(e) => handleInputChange('middle_name', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Last Name" 
                  value={formData.last_name} 
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Suffix" 
                  placeholder="Jr., Sr., III…"
                  value={formData.suffix} 
                  onChange={(e) => handleInputChange('suffix', e.target.value)}
                  disabled={!isEditMode} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                <Input 
                  label="Date of Birth" 
                  type="date" 
                  value={formData.date_of_birth} 
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  disabled={!isEditMode} 
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <p className="py-2 text-sm text-gray-700 whitespace-nowrap text-left">
                    {formData.date_of_birth ? (() => {
                      const dob = new Date(formData.date_of_birth)
                      const today = new Date()
                      let age = today.getFullYear() - dob.getFullYear()
                      const m = today.getMonth() - dob.getMonth()
                      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
                      return `${age} years old`
                    })() : '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                  <div className="flex gap-6 py-2">
                    {['male', 'female'].map((val) => (
                      <label
                        key={val}
                        className={`flex items-center gap-2 ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => isEditMode && handleInputChange('sex', val)}
                      >
                        {/* Custom radio circle */}
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 ${
                          formData.sex === val
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {formData.sex === val && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                          )}
                        </span>
                        <span className="text-sm text-gray-700 capitalize">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => handleInputChange('marital_status', e.target.value)}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select Nationality</option>
                    <option value="filipino">Filipino</option>
                    <option value="american">American</option>
                    <option value="japanese">Japanese</option>
                    <option value="korean">Korean</option>
                    <option value="chinese">Chinese</option>
                    <option value="british">British</option>
                    <option value="canadian">Canadian</option>
                    <option value="australian">Australian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Government IDs Section */}
              <div className="mt-8 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Government IDs</h4>
                    <p className="text-sm text-gray-500 mt-1">Official identification documents issued by government</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="National ID" 
                    value={formData.national_id} 
                    onChange={(e) => handleInputChange('national_id', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="Voter's ID" 
                    value={formData.voters_id} 
                    onChange={(e) => handleInputChange('voters_id', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="Pag-IBIG Number" 
                    value={formData.pagibig_number} 
                    onChange={(e) => handleInputChange('pagibig_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="PhilHealth Number" 
                    value={formData.philhealth_number} 
                    onChange={(e) => handleInputChange('philhealth_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="SSS Number" 
                    value={formData.sss_number} 
                    onChange={(e) => handleInputChange('sss_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="TIN Number" 
                    value={formData.tin_number} 
                    onChange={(e) => handleInputChange('tin_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mt-8 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Paperclip className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Attachments</h4>
                    <p className="text-sm text-gray-500 mt-1">Upload and manage personal documents and files</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 mb-4"></div>
                
                {/* Upload Section */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        console.log('📎 File selected:', file?.name)
                        
                        if (!file) {
                          console.log('❌ No file selected')
                          return
                        }
                        
                        if (!employee) {
                          console.log('❌ No employee data')
                          toast.error('Employee data not loaded')
                          return
                        }

                        // Validate file size (10MB max)
                        if (file.size > 10 * 1024 * 1024) {
                          console.log('❌ File too large:', file.size)
                          toast.error('File size must be less than 10MB')
                          e.target.value = ''
                          return
                        }

                        console.log('📤 Starting attachment upload:', {
                          fileName: file.name,
                          fileSize: file.size,
                          employeeId: employee.id,
                          uploadedBy: undefined
                        })

                        try {
                          const result = await uploadEmployeeAttachment.mutateAsync({
                            employeeId: employee.id,
                            file,
                            uploadedBy: undefined,
                            employeeName: `${employee.first_name} ${employee.last_name}`,
                          })
                          console.log('✅ Attachment upload successful:', result)
                          e.target.value = '' // Reset input
                        } catch (error: any) {
                          console.error('❌ Attachment upload failed:', error)
                          console.error('Error message:', error?.message)
                          toast.error(error?.message || 'Failed to upload attachment')
                          e.target.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        console.log('🖱️ Upload button clicked', { isEditMode, isAdmin })
                        const input = document.getElementById('file-upload') as HTMLInputElement
                        if (input) {
                          console.log('📂 Triggering file input click')
                          input.click()
                        } else {
                          console.log('❌ File input not found')
                        }
                      }}
                      disabled={!isEditMode || uploadEmployeeAttachment.isPending}
                      className={`cursor-pointer flex flex-col items-center w-full ${(!isEditMode || uploadEmployeeAttachment.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadEmployeeAttachment.isPending ? (
                        <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin mb-2" />
                      ) : (
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="text-orange font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max. 10MB)</p>
                    </button>
                  </div>
                </div>

                {/* Attachments Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingAttachments ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                          </td>
                        </tr>
                      ) : employeeAttachments.length > 0 ? (
                        employeeAttachments.map((attachment) => (
                          <tr key={attachment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{attachment.file_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {(attachment.file_size / 1024).toFixed(0)} KB
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">.{attachment.file_name.split('.').pop()?.toLowerCase() ?? attachment.file_type}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{attachment.created_at ? formatDate(attachment.created_at) : '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {attachment.uploader ? `${attachment.uploader.first_name} ${attachment.uploader.last_name}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                  onClick={async () => {
                                    try {
                                      const { employeeAttachmentService } = await import('@/services')
                                      const blob = await employeeAttachmentService.downloadFile(attachment.file_path)
                                      const url = URL.createObjectURL(blob)
                                      window.open(url, '_blank')
                                      setTimeout(() => URL.revokeObjectURL(url), 1000)
                                    } catch (error) {
                                      console.error('Error viewing file:', error)
                                      toast.error('Failed to open file')
                                    }
                                  }}
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => downloadEmployeeAttachment.mutate({
                                    filePath: attachment.file_path,
                                    fileName: attachment.file_name
                                  })}
                                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                  disabled={downloadEmployeeAttachment.isPending}
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {isEditMode && (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm('Are you sure you want to delete this file?')) {
                                        await deleteEmployeeAttachment.mutateAsync({
                                          id: attachment.id,
                                          filePath: attachment.file_path,
                                          employeeId: employee!.id
                                        })
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                    disabled={deleteEmployeeAttachment.isPending}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                            No attachments found. Upload files to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'contact':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Phone className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  <p className="text-sm text-gray-500 mt-1">Phone numbers, email addresses, and physical addresses</p>
                </div>
              </div>
              {!readOnly && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => isEditMode ? handleContactSave() : setIsEditMode(!isEditMode)}
                disabled={updateEmployee.isPending}
              >
                {updateEmployee.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  isEditMode ? 'Save' : 'Edit'
                )}
              </Button>
              )}
            </div>
            <div className="border-t border-gray-200 mb-6"></div>

            {/* Address Section */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Address</h4>
                  <p className="text-sm text-gray-500 mt-1">Physical address and location details</p>
                </div>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Address" 
                  value={contactFormData.address}
                  onChange={(e) => handleContactInputChange('address', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="City" 
                  value={contactFormData.city}
                  onChange={(e) => handleContactInputChange('city', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="State / Province" 
                  value={contactFormData.state}
                  onChange={(e) => handleContactInputChange('state', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Zip / Postal Code" 
                  value={contactFormData.zip_code}
                  onChange={(e) => handleContactInputChange('zip_code', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Country" 
                  value={contactFormData.country}
                  onChange={(e) => handleContactInputChange('country', e.target.value)}
                  disabled={!isEditMode} 
                />
              </div>
            </div>

            {/* Telephone Section */}
            <div className="mt-8 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Telephone</h4>
                  <p className="text-sm text-gray-500 mt-1">Contact phone numbers</p>
                </div>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Home Phone" 
                  type="tel"
                  value={contactFormData.home_phone}
                  onChange={(e) => handleContactInputChange('home_phone', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Mobile Phone" 
                  type="tel"
                  value={contactFormData.mobile_phone}
                  onChange={(e) => handleContactInputChange('mobile_phone', e.target.value)}
                  disabled={!isEditMode} 
                />
              </div>
            </div>

            {/* Email Section */}
            <div className="mt-8 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Mail className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Email</h4>
                  <p className="text-sm text-gray-500 mt-1">Email addresses for communication</p>
                </div>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Work Email" 
                  type="email"
                  value={contactFormData.work_email}
                  onChange={(e) => handleContactInputChange('work_email', e.target.value)}
                  disabled={!isEditMode} 
                />
                <Input 
                  label="Personal Email" 
                  type="email"
                  value={contactFormData.personal_email}
                  onChange={(e) => handleContactInputChange('personal_email', e.target.value)}
                  disabled={!isEditMode} 
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div className="mt-8 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Paperclip className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Attachments</h4>
                  <p className="text-sm text-gray-500 mt-1">Upload and manage contact-related documents</p>
                </div>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>
              
              {/* Upload Section */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
                  <input
                    type="file"
                    id="contact-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        console.log('File selected:', file)
                        // TODO: Implement file upload
                      }
                    }}
                    disabled={!isEditMode}
                  />
                  <label 
                    htmlFor="contact-file-upload" 
                    className={`cursor-pointer ${!isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-orange font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max. 10MB)</p>
                  </label>
                </div>
              </div>

              {/* Attachments Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Empty state */}
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                        No attachments found. Upload files to get started.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'employment':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Briefcase className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
                  <p className="text-sm text-gray-500 mt-1">Job information, department, and employment status</p>
                </div>
              </div>
              {!readOnly && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => isEditMode ? handleEmploymentSave() : setIsEditMode(!isEditMode)}
                disabled={updateEmployee.isPending || !isAdmin}
              >
                {updateEmployee.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  isEditMode ? 'Save' : 'Edit'
                )}
              </Button>
              )}
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Employee ID" 
                value={employee.employee_id} 
                disabled 
              />
              <Input 
                label="Hire Date" 
                type="date" 
                value={employmentFormData.hire_date}
                onChange={(e) => handleEmploymentInputChange('hire_date', e.target.value)}
                disabled={!isEditMode || !isAdmin} 
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department/Unit</label>
                <select
                  value={employmentFormData.department_id}
                  onChange={(e) => handleEmploymentInputChange('department_id', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Department/Unit</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <select
                  value={employmentFormData.job_title_id}
                  onChange={(e) => handleEmploymentInputChange('job_title_id', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Job Title</option>
                  {jobTitles.map((jobTitle) => (
                    <option key={jobTitle.id} value={jobTitle.id}>
                      {jobTitle.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={employmentFormData.employment_type_id}
                  onChange={(e) => handleEmploymentInputChange('employment_type_id', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Employment Type</option>
                  {employmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                <select
                  value={employmentFormData.location_id}
                  onChange={(e) => handleEmploymentInputChange('location_id', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}, {location.country}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                <select
                  value={employmentFormData.job_specification_id}
                  onChange={(e) => handleEmploymentInputChange('job_specification_id', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Job Description</option>
                  {jobDescriptions.map((jobDesc) => (
                    <option key={jobDesc.id} value={jobDesc.id}>
                      {jobDesc.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                <select
                  value={employmentFormData.status}
                  onChange={(e) => handleEmploymentInputChange('status', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="probation">Probation</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                  <option value="resigned">Resigned</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                <select
                  value={employmentFormData.manager_id}
                  onChange={(e) => handleEmploymentInputChange('manager_id', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Manager</option>
                  {allEmployees
                    .filter(emp => emp.id !== employee?.id)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Arrangement</label>
                <select
                  value={employmentFormData.work_location_type}
                  onChange={(e) => handleEmploymentInputChange('work_location_type', e.target.value)}
                  disabled={!isEditMode || !isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Arrangement</option>
                  <option value="on_site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Include Employment Contract Details */}
            <div className="mt-8 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Employment Contract Details</h4>
                    <p className="text-sm text-gray-500 mt-1">Contract period and related documents</p>
                  </div>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={includeContractDetails}
                      onChange={(e) => setIncludeContractDetails(e.target.checked)}
                      disabled={!isEditMode || !isAdmin}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full transition ${includeContractDetails ? 'bg-orange' : 'bg-gray-300'} ${(!isEditMode || !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${includeContractDetails ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {includeContractDetails ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>

              {includeContractDetails && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Contract Start Date" 
                      type="date"
                      value={employmentFormData.contract_start_date}
                      onChange={(e) => handleEmploymentInputChange('contract_start_date', e.target.value)}
                      disabled={!isEditMode || !isAdmin} 
                    />
                    <Input 
                      label="Contract End Date" 
                      type="date"
                      value={employmentFormData.contract_end_date}
                      onChange={(e) => handleEmploymentInputChange('contract_end_date', e.target.value)}
                      disabled={!isEditMode || !isAdmin} 
                    />
                  </div>

                  {/* Contract Details Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Details</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
                      <input
                        type="file"
                        id="contract-file-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        disabled={!isEditMode || !isAdmin || uploadContractDocument.isPending}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          if (!employee?.id) {
                            toast.error('Employee ID not found')
                            return
                          }

                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('File size must be less than 10MB')
                            e.target.value = ''
                            return
                          }
                          
                          console.log('📤 Starting contract upload:', { 
                            fileName: file.name, 
                            fileSize: file.size,
                            employeeId: employee.id 
                          })
                          
                          try {
                            const result = await uploadContractDocument.mutateAsync({
                              file,
                              employeeId: employee.id,
                              uploadedBy: undefined,
                              employeeName: `${employee.first_name} ${employee.last_name}`,
                            })
                            console.log('✅ Contract upload successful:', result)
                            e.target.value = ''
                          } catch (error: any) {
                            console.error('❌ Contract upload failed:', error)
                            console.error('Error message:', error?.message)
                            console.error('Error stack:', error?.stack)
                            toast.error(error?.message || 'Failed to upload contract. Check console for details.')
                            e.target.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          const input = document.getElementById('contract-file-upload') as HTMLInputElement
                          if (input) input.click()
                        }}
                        disabled={!isEditMode || !isAdmin || uploadContractDocument.isPending}
                        className={`cursor-pointer flex flex-col items-center w-full ${(!isEditMode || !isAdmin || uploadContractDocument.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadContractDocument.isPending ? (
                          <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin mb-2" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {uploadContractDocument.isPending ? 'Uploading...' : 'Click to upload contract'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</span>
                      </button>
                    </div>
                  </div>

                  {/* Contract Documents Table */}
                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Uploaded Contracts</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {isLoadingContracts ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center">
                                <div className="inline-block w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                              </td>
                            </tr>
                          ) : contractDocuments.length > 0 ? (
                            contractDocuments.map((doc) => (
                              <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{doc.file_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {doc.file_name.split('.').pop()?.toUpperCase() || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {formatDate(doc.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {doc.uploader ? `${doc.uploader.first_name} ${doc.uploader.last_name}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                      onClick={async () => {
                                        try {
                                          const { contractDocumentService } = await import('@/services')
                                          const blob = await contractDocumentService.downloadFile(doc.file_path)
                                          const url = URL.createObjectURL(blob)
                                          window.open(url, '_blank')
                                          // Clean up the URL after a delay
                                          setTimeout(() => URL.revokeObjectURL(url), 1000)
                                        } catch (error) {
                                          console.error('Error viewing file:', error)
                                          toast.error('Failed to open file')
                                        }
                                      }}
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                      onClick={() => {
                                        downloadContractDocument.mutate({
                                          filePath: doc.file_path,
                                          fileName: doc.file_name,
                                        })
                                      }}
                                      disabled={downloadContractDocument.isPending}
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this contract?')) {
                                          deleteContractDocument.mutate({
                                            id: doc.id,
                                            filePath: doc.file_path,
                                            employeeId: employee?.id || '',
                                          })
                                        }
                                      }}
                                      disabled={!isAdmin || deleteContractDocument.isPending}
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                No contracts uploaded yet. Upload files to get started.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'emergency':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Heart className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Contacts</h3>
                  <p className="text-sm text-gray-500 mt-1">Emergency contact persons and their information</p>
                </div>
              </div>
              {!readOnly && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Cancel' : 'Edit'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setSelectedEmergencyContact(undefined)
                    setIsEmergencyContactModalOpen(true)
                  }}
                >
                  Add Contact
                </Button>
              </div>
              )}
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            
            {isLoadingContacts ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : emergencyContacts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No emergency contacts added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emergencyContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.relationship}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.mobile_phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.home_phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.work_phone || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedEmergencyContact(contact)
                                setIsEmergencyContactModalOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this emergency contact?')) {
                                  await deleteEmergencyContact.mutateAsync(contact.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Attachments Section */}
            <div className="mt-8 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Paperclip className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Attachments</h4>
                  <p className="text-sm text-gray-500 mt-1">Emergency contact-related documents</p>
                </div>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>
              
              {/* Upload Section */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
                  <input
                    type="file"
                    id="emergency-contact-file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      console.log('📎 Emergency contact file selected:', file?.name)
                      
                      if (!file || !employee?.id) {
                        console.log('❌ No file or employee ID')
                        return
                      }

                      // Validate file size (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be less than 10MB')
                        e.target.value = ''
                        return
                      }

                      try {
                        console.log('📤 Starting emergency contact attachment upload')
                        
                        await uploadEmployeeAttachment.mutateAsync({
                          file,
                          employeeId: employee.id,
                          documentType: 'emergency_contact',
                          description: 'Emergency contact document',
                          employeeName: `${employee.first_name} ${employee.last_name}`,
                        })
                        
                        console.log('✅ Emergency contact attachment upload successful')
                        toast.success('File uploaded successfully')
                        e.target.value = ''
                      } catch (error: any) {
                        console.error('❌ Emergency contact attachment upload failed:', error)
                        toast.error(error?.message || 'Failed to upload file')
                        e.target.value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      const input = document.getElementById('emergency-contact-file-upload') as HTMLInputElement
                      if (input) input.click()
                    }}
                    disabled={uploadEmployeeAttachment.isPending || !canSelfEdit}
                    className={`cursor-pointer flex flex-col items-center w-full ${(uploadEmployeeAttachment.isPending || !canSelfEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadEmployeeAttachment.isPending ? (
                      <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {uploadEmployeeAttachment.isPending ? 'Uploading...' : 'Click to upload'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</span>
                  </button>
                </div>
              </div>

              {/* Attachments Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingAttachments ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <div className="inline-block w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                        </td>
                      </tr>
                    ) : employeeAttachments.filter(a => a.document_type === 'emergency_contact').length > 0 ? (
                      employeeAttachments.filter(a => a.document_type === 'emergency_contact').map((attachment) => (
                        <tr key={attachment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{attachment.file_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {(attachment.file_size / 1024).toFixed(0)} KB
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">.{attachment.file_name.split('.').pop()?.toLowerCase() ?? attachment.file_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{attachment.created_at ? formatDate(attachment.created_at) : '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {attachment.uploader ? `${attachment.uploader.first_name} ${attachment.uploader.last_name}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await downloadEmployeeAttachment.mutateAsync({
                                      filePath: attachment.file_path,
                                      fileName: attachment.file_name
                                    })
                                  } catch (error) {
                                    console.error('Error viewing file:', error)
                                    toast.error('Failed to open file')
                                  }
                                }}
                                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                disabled={downloadEmployeeAttachment.isPending}
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadEmployeeAttachment.mutate({
                                  filePath: attachment.file_path,
                                  fileName: attachment.file_name
                                })}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                disabled={downloadEmployeeAttachment.isPending}
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {isEditMode && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this file?')) {
                                      await deleteEmployeeAttachment.mutateAsync({
                                        id: attachment.id,
                                        filePath: attachment.file_path,
                                        employeeId: employee!.id
                                      })
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  disabled={deleteEmployeeAttachment.isPending}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          No attachments found. Upload files to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'dependents':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Users className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Dependents</h3>
                  <p className="text-sm text-gray-500 mt-1">Family members and dependents information</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Add Dependent</Button>
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <p className="text-gray-500 text-center py-8">No dependents added yet.</p>
          </div>
        )
      
      case 'banking':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-orange" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Banking & Payroll Information</h3>
                <p className="text-sm text-gray-500 mt-1">Bank account details and payroll setup</p>
              </div>
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Banking & Payroll module coming soon</p>
              <p className="text-sm text-gray-400 mt-1">This section will display bank account and payroll details once the module is configured.</p>
            </div>
          </div>
        )
      
      case 'benefits':
        return <BenefitsTabContent employeeId={employee.id} selfService={selfService} />
      
      case 'immigration':
        return (
          <div className="space-y-4">
            {/* Title — do not modify */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Plane className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Immigration Documents</h3>
                  <p className="text-sm text-gray-500 mt-1">Passport, visa, and work permit information</p>
                </div>
              </div>
              {!readOnly && isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingImmigrationDoc(null)
                    setImmigrationForm({ document_type: 'passport', document_number: '', issued_date: '', expiry_date: '', eligible_status: '', issued_by: '', eligible_review_date: '', comments: '' })
                    setIsImmigrationModalOpen(true)
                  }}
                >
                  Add Immigration
                </Button>
              )}
            </div>
            <div className="border-t border-gray-200 mb-6" />

            {/* Document list */}
            {isLoadingImmigration ? (
              <div className="text-center py-8 text-gray-400">Loading…</div>
            ) : immigrationDocuments.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No immigration documents added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {immigrationDocuments.map((doc) => (
                  <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          doc.document_type === 'passport' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {doc.document_type === 'passport' ? 'Passport' : 'Visa'}
                        </span>
                        <span className="font-mono font-semibold text-gray-900 text-sm">{doc.document_number}</span>
                      </div>
                      {!readOnly && isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingImmigrationDoc(doc)
                              setImmigrationForm({
                                document_type: doc.document_type,
                                document_number: doc.document_number,
                                issued_date: doc.issued_date || '',
                                expiry_date: doc.expiry_date || '',
                                eligible_status: doc.eligible_status || '',
                                issued_by: doc.issued_by || '',
                                eligible_review_date: doc.eligible_review_date || '',
                                comments: doc.comments || '',
                              })
                              setIsImmigrationModalOpen(true)
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteImmigrationDoc.mutate({ id: doc.id, employeeId: employee!.id })}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      {doc.issued_date && (
                        <div><span className="text-gray-500">Issued: </span><span className="text-gray-800">{formatDate(doc.issued_date)}</span></div>
                      )}
                      {doc.expiry_date && (
                        <div><span className="text-gray-500">Expires: </span><span className="text-gray-800">{formatDate(doc.expiry_date)}</span></div>
                      )}
                      {doc.eligible_status && (
                        <div><span className="text-gray-500">Status: </span><span className="text-gray-800">{doc.eligible_status}</span></div>
                      )}
                      {doc.issued_by && (
                        <div><span className="text-gray-500">Issued By: </span><span className="text-gray-800">{doc.issued_by}</span></div>
                      )}
                      {doc.eligible_review_date && (
                        <div><span className="text-gray-500">Review Date: </span><span className="text-gray-800">{formatDate(doc.eligible_review_date)}</span></div>
                      )}
                    </div>
                    {doc.comments && (
                      <p className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">{doc.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attachments Section */}
            <div className="mt-8 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Paperclip className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Attachments</h4>
                  <p className="text-sm text-gray-500 mt-1">Upload and manage immigration documents and files</p>
                </div>
              </div>
              <div className="border-t border-gray-200 mb-4"></div>

              {/* Upload */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
                  <input
                    type="file"
                    id="immigration-file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !employee) return
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be less than 10MB')
                        e.target.value = ''
                        return
                      }
                      try {
                        await uploadEmployeeAttachment.mutateAsync({ employeeId: employee.id, file, documentType: 'immigration', uploadedBy: undefined, employeeName: `${employee.first_name} ${employee.last_name}` })
                        e.target.value = ''
                      } catch (error: any) {
                        toast.error(error?.message || 'Failed to upload attachment')
                        e.target.value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => (document.getElementById('immigration-file-upload') as HTMLInputElement)?.click()}
                    disabled={!isEditMode || uploadEmployeeAttachment.isPending}
                    className={`cursor-pointer flex flex-col items-center w-full ${(!isEditMode || uploadEmployeeAttachment.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadEmployeeAttachment.isPending ? (
                      <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin mb-2" />
                    ) : (
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    )}
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-orange font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max. 10MB)</p>
                  </button>
                </div>
              </div>

              {/* Attachments Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingAttachments ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <div className="inline-block w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                        </td>
                      </tr>
                    ) : employeeAttachments.filter(a => a.document_type === 'immigration').length > 0 ? (
                      employeeAttachments.filter(a => a.document_type === 'immigration').map((attachment) => (
                        <tr key={attachment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{attachment.file_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{(attachment.file_size / 1024).toFixed(0)} KB</td>
                          <td className="px-4 py-3 text-sm text-gray-600">.{attachment.file_name.split('.').pop()?.toLowerCase() ?? attachment.file_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{attachment.created_at ? formatDate(attachment.created_at) : '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {attachment.uploader ? `${attachment.uploader.first_name} ${attachment.uploader.last_name}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                title="View"
                                onClick={async () => {
                                  try {
                                    const { employeeAttachmentService } = await import('@/services')
                                    const blob = await employeeAttachmentService.downloadFile(attachment.file_path)
                                    const url = URL.createObjectURL(blob)
                                    window.open(url, '_blank')
                                    setTimeout(() => URL.revokeObjectURL(url), 1000)
                                  } catch { toast.error('Failed to open file') }
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadEmployeeAttachment.mutate({ filePath: attachment.file_path, fileName: attachment.file_name })}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                disabled={downloadEmployeeAttachment.isPending}
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {isEditMode && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this file?')) {
                                      await deleteEmployeeAttachment.mutateAsync({ id: attachment.id, filePath: attachment.file_path, employeeId: employee!.id })
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  disabled={deleteEmployeeAttachment.isPending}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          No attachments found. Upload files to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add / Edit Modal */}
            {isImmigrationModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                    {editingImmigrationDoc ? 'Edit Immigration' : 'Add Immigration'}
                  </h4>

                  {/* Document type radio */}
                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-2">Document</p>
                    <div className="flex items-center gap-6">
                      {(['passport', 'visa'] as const).map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="document_type"
                            value={type}
                            checked={immigrationForm.document_type === type}
                            onChange={() => setImmigrationForm(f => ({ ...f, document_type: type }))}
                            className="w-4 h-4 accent-orange cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fields grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number <span className="text-red-500">*</span></label>
                      <Input
                        value={immigrationForm.document_number}
                        onChange={(e) => setImmigrationForm(f => ({ ...f, document_number: e.target.value }))}
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date</label>
                      <Input
                        type="date"
                        value={immigrationForm.issued_date}
                        onChange={(e) => setImmigrationForm(f => ({ ...f, issued_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <Input
                        type="date"
                        value={immigrationForm.expiry_date}
                        onChange={(e) => setImmigrationForm(f => ({ ...f, expiry_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Status</label>
                      <Input
                        value={immigrationForm.eligible_status}
                        onChange={(e) => setImmigrationForm(f => ({ ...f, eligible_status: e.target.value }))}
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                      <Select
                        value={immigrationForm.issued_by}
                        onChange={(e) => setImmigrationForm(f => ({ ...f, issued_by: e.target.value }))}
                        options={[
                          { value: '', label: '-- Select --' },
                          { value: 'DFA', label: 'DFA' },
                          { value: 'BI', label: 'Bureau of Immigration' },
                          { value: 'DOJ', label: 'DOJ' },
                          { value: 'Embassy', label: 'Embassy' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Review Date</label>
                      <Input
                        type="date"
                        value={immigrationForm.eligible_review_date}
                        onChange={(e) => setImmigrationForm(f => ({ ...f, eligible_review_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <textarea
                      value={immigrationForm.comments}
                      onChange={(e) => setImmigrationForm(f => ({ ...f, comments: e.target.value }))}
                      placeholder="Type Comments here"
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange resize-y"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400">* Required</p>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setIsImmigrationModalOpen(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        disabled={!immigrationForm.document_number.trim() || createImmigrationDoc.isPending || updateImmigrationDoc.isPending}
                        onClick={async () => {
                          if (!employee?.id || !immigrationForm.document_number.trim()) return
                          const payload = {
                            document_type: immigrationForm.document_type,
                            document_number: immigrationForm.document_number.trim(),
                            issued_date: immigrationForm.issued_date || null,
                            expiry_date: immigrationForm.expiry_date || null,
                            eligible_status: immigrationForm.eligible_status || null,
                            issued_by: immigrationForm.issued_by || null,
                            eligible_review_date: immigrationForm.eligible_review_date || null,
                            comments: immigrationForm.comments || null,
                          }
                          if (editingImmigrationDoc) {
                            await updateImmigrationDoc.mutateAsync({ id: editingImmigrationDoc.id, data: payload, employeeId: employee.id })
                          } else {
                            await createImmigrationDoc.mutateAsync({ ...payload, employee_id: employee.id })
                          }
                          setIsImmigrationModalOpen(false)
                        }}
                      >
                        {createImmigrationDoc.isPending || updateImmigrationDoc.isPending ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      
      case 'assets':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Laptop className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Assigned Assets & Equipment</h3>
                  <p className="text-sm text-gray-500 mt-1">Company property and equipment assigned to employee</p>
                </div>
              </div>
              {!readOnly && !selfService && isAdmin && (
                <Button variant="secondary" size="sm" onClick={() => {
                  setSelectedAssetIdToAssign('')
                  setAssignCondition('')
                  setIsAssignAssetModalOpen(true)
                }}>
                  Assign Asset
                </Button>
              )}
            </div>
            <div className="border-t border-gray-200 mb-6" />

            {/* Asset list */}
            {isLoadingAssets || isLoadingAssignments ? (
              <div className="text-center py-8 text-gray-400">Loading assets…</div>
            ) : assignedAssets.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No assets assigned yet.</p>
                {!readOnly && !selfService && isAdmin && (
                  <p className="text-sm text-gray-400 mt-1">Click "Assign Asset" to assign company equipment.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {assignedAssets.map((asset) => {
                  const assignment = assetAssignments.find(a => a.asset_id === asset.id)
                  return (
                    <div key={asset.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Laptop className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.name}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {asset.asset_tag && (
                              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{asset.asset_tag}</span>
                            )}
                            {asset.category?.name && (
                              <span className="text-xs text-gray-400">{asset.category.name}</span>
                            )}
                            {asset.serial_number && (
                              <span className="text-xs text-gray-400">S/N: {asset.serial_number}</span>
                            )}
                            {asset.condition && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                asset.condition === 'excellent' ? 'bg-green-100 text-green-700' :
                                asset.condition === 'good' ? 'bg-blue-100 text-blue-700' :
                                asset.condition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)}</span>
                            )}
                          </div>
                          {assignment?.assigned_date && (
                            <p className="text-xs text-gray-400 mt-1">Assigned {formatDate(assignment.assigned_date)}</p>
                          )}
                        </div>
                      </div>
                      {!readOnly && !selfService && isAdmin && assignment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignmentId(assignment.id)
                            setReturnCondition('')
                            setReturnNotes('')
                            setIsReturnAssetModalOpen(true)
                          }}
                          className="text-gray-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Return
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Assign Asset Modal */}
            {isAssignAssetModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Assign Asset to Employee</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset <span className="text-red-500">*</span></label>
                      <Select
                        value={selectedAssetIdToAssign}
                        onChange={(e) => setSelectedAssetIdToAssign(e.target.value)}
                        options={[
                          { value: '', label: availableAssets.length === 0 ? 'No available assets' : 'Choose an asset…' },
                          ...availableAssets.map(a => ({
                            value: a.id,
                            label: `${a.name}${a.asset_tag ? ` [${a.asset_tag}]` : ''}${a.category?.name ? ` — ${a.category.name}` : ''}`
                          }))
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition on Assignment</label>
                      <Select
                        value={assignCondition}
                        onChange={(e) => setAssignCondition(e.target.value)}
                        options={[
                          { value: '', label: 'Select condition…' },
                          { value: 'excellent', label: 'Excellent' },
                          { value: 'good', label: 'Good' },
                          { value: 'fair', label: 'Fair' },
                          { value: 'poor', label: 'Poor' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={() => setIsAssignAssetModalOpen(false)}>Cancel</Button>
                    <Button
                      variant="primary"
                      disabled={!selectedAssetIdToAssign || assignAsset.isPending}
                      onClick={async () => {
                        if (!employee?.id || !selectedAssetIdToAssign) return
                        await assignAsset.mutateAsync({
                          assetId: selectedAssetIdToAssign,
                          employeeId: employee.id,
                          assignedBy: currentEmployee?.id || employee.id,
                          condition: assignCondition || undefined,
                        })
                        setIsAssignAssetModalOpen(false)
                      }}
                    >
                      {assignAsset.isPending ? 'Assigning…' : 'Assign Asset'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Return Asset Modal */}
            {isReturnAssetModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Return Asset</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition on Return</label>
                      <Select
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        options={[
                          { value: '', label: 'Select condition…' },
                          { value: 'excellent', label: 'Excellent' },
                          { value: 'good', label: 'Good' },
                          { value: 'fair', label: 'Fair' },
                          { value: 'poor', label: 'Poor' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Input
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Any notes about the return…"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={() => setIsReturnAssetModalOpen(false)}>Cancel</Button>
                    <Button
                      variant="primary"
                      disabled={returnAsset.isPending}
                      onClick={async () => {
                        if (!selectedAssignmentId) return
                        await returnAsset.mutateAsync({
                          assignmentId: selectedAssignmentId,
                          returnedBy: currentEmployee?.id || employee?.id || '',
                          condition: returnCondition || undefined,
                          notes: returnNotes || undefined,
                        })
                        setIsReturnAssetModalOpen(false)
                        setSelectedAssignmentId(null)
                      }}
                    >
                      {returnAsset.isPending ? 'Returning…' : 'Confirm Return'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      
      case 'qualifications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Education & Qualifications</h3>
                  <p className="text-sm text-gray-500 mt-1">Academic degrees, certifications, and training records</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Add Qualification</Button>
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <p className="text-gray-500 text-center py-8">No qualifications added yet.</p>
          </div>
        )
      
      case 'security': {
        const handlePasswordChange = async (e: React.FormEvent) => {
          e.preventDefault()
          setPwError(null)

          if (pwForm.newPassword.length < 8) {
            setPwError('Password must be at least 8 characters.')
            return
          }
          if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('Passwords do not match.')
            return
          }

          setPwLoading(true)
          try {
            const res = await fetch('/api/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPassword: pwForm.newPassword }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to change password.')
            toast.success('Password changed successfully.')
            setPwForm({ newPassword: '', confirmPassword: '' })
            logAction({
              employee_id: employee.id,
              action: 'Password Changed',
              details: 'Employee changed their own password via Security & Privacy Settings',
            })
          } catch (err: any) {
            setPwError(err?.message || 'Failed to change password. Please try again.')
          } finally {
            setPwLoading(false)
          }
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange/10 rounded-lg">
                <Lock className="w-5 h-5 text-orange" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Security & Privacy Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Account security, password, and privacy controls</p>
              </div>
            </div>
            <div className="border-t border-gray-200 mb-6" />

            {/* Change Password */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h4>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 characters.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
                  />
                </div>
                {pwError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>
                )}
                <Button type="submit" disabled={pwLoading} className="w-full">
                  {pwLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </div>

            {/* 2FA status (read-only for now) */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg max-w-md">
              <span className="text-sm text-gray-700">Two-Factor Authentication</span>
              <Badge variant="warning">Disabled</Badge>
            </div>
          </div>
        )
      }
      
      case 'signature': {
        return (
          <SignatureTab
            employee={employee}
            readOnly={readOnly}
            uploadAttachment={uploadEmployeeAttachment}
          />
        )
      }

      case 'committees': {
        return <EmployeeCommitteesTab employeeId={employee.id} />
      }

      default:
        return null
    }
  }

  // Service length helper (reused in both mobile and desktop profile cards)
  const serviceLength = employee.hire_date ? (() => {
    const start = new Date(employee.hire_date)
    const now = new Date()
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    const y = Math.floor(months / 12)
    const m = months % 12
    if (y === 0) return `${m}mo`
    if (m === 0) return `${y}yr${y > 1 ? 's' : ''}`
    return `${y}yr${y > 1 ? 's' : ''} ${m}mo`
  })() : 'N/A'

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-0">
      {/* Header — desktop only (back button + name) */}
      {!hideBackButton && (
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backHref} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-sm text-gray-500">{employee.job_title?.title || 'No title'} • {employee.department?.name || 'No department'}</p>
            </div>
          </div>
          {getStatusBadge(employee.status ?? '')}
        </div>
      )}

      {/* ── MOBILE Profile card ─────────────────────────────────────── */}
      <div className="sm:hidden">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative flex-shrink-0 group">
              <Avatar
                src={employee.avatar_url}
                firstName={employee.first_name}
                lastName={employee.last_name}
                size="lg"
              />
              {(isAdmin || selfService) && !readOnly && (
                <label
                  htmlFor="photo-upload-mobile"
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input id="photo-upload-mobile" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} className="hidden" />
                </label>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  {employee.first_name} {employee.last_name}
                </h2>
                {getStatusBadge(employee.status ?? '')}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{employee.job_title?.title || 'No title'}</p>
              <p className="text-xs text-gray-400 truncate">{employee.department?.name || 'No department'}</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xs text-gray-400">ID</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{employee.employee_id}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Hired</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{formatDate(employee.hire_date)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Service</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{serviceLength}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── DESKTOP Profile summary card ────────────────────────────── */}
      <Card className="hidden sm:block">
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0 group">
            <Avatar src={employee.avatar_url} firstName={employee.first_name} lastName={employee.last_name} size="xl" />
            {(isAdmin || selfService) && !readOnly && (
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all cursor-pointer"
                title="Change photo"
              >
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} className="hidden" />
              </label>
            )}
            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex-1 grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 min-w-0">
            <div>
              <div className="text-xs text-gray-500">Employee ID</div>
              <div className="text-sm font-medium text-gray-900">{employee.employee_id}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium text-gray-900 truncate">{employee.email}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Mobile Phone</div>
              <div className="text-sm font-medium text-gray-900">{(employee as any).mobile_phone || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Hire Date</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(employee.hire_date)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Length of Service</div>
              <div className="text-sm font-medium text-gray-900">{serviceLength}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── MOBILE: horizontal pill tab strip ──────────────────────── */}
      <div className="sm:hidden overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 w-max pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-orange text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── DESKTOP: sidebar + content ──────────────────────────────── */}
      <div className="hidden sm:flex gap-6">
        <div className="w-64 flex-shrink-0">
          <Card className="p-0">
            <nav className="flex flex-col">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                      ${index !== 0 ? 'border-t border-gray-100' : ''}
                      ${activeTab === tab.key
                        ? 'bg-orange/10 text-orange border-l-4 border-l-orange'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </Card>
        </div>
        <div className="flex-1">
          <Card>{renderTabContent()}</Card>
        </div>
      </div>

      {/* ── MOBILE: full-width content card ─────────────────────────── */}
      <div className="sm:hidden">
        <Card>{renderTabContent()}</Card>
      </div>

      {/* Emergency Contact Modal */}
      {employee && (
        <EmergencyContactFormModal
          open={isEmergencyContactModalOpen}
          onClose={() => {
            setIsEmergencyContactModalOpen(false)
            setSelectedEmergencyContact(undefined)
          }}
          employeeId={employee.id}
          contact={selectedEmergencyContact}
        />
      )}
    </div>
  )
}


