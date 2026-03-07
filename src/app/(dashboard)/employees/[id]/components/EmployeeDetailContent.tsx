'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, Briefcase, User, Users, CreditCard, Shield, Award, FileText, Heart, Plane, Laptop, GraduationCap, Lock, Save, Paperclip, Upload, Download, Trash2, Edit, Eye, Camera } from 'lucide-react'
import { Card, Avatar, Badge, Button, Input, Select } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { useEmployeeByEmployeeId, useUpdateEmployee, useEmployees } from '@/hooks/useEmployees'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'
import { useJobTitles } from '@/hooks/useJobTitles'
import { useJobDescriptions } from '@/hooks/useJobDescriptions'
import { useEmploymentTypes } from '@/hooks/useEmploymentTypes'
import { useLocations } from '@/hooks/useLocations'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmergencyContacts, useDeleteEmergencyContact } from '@/hooks/useEmergencyContacts'
import { useContractDocuments, useUploadContractDocument, useDeleteContractDocument, useDownloadContractDocument } from '@/hooks/useContractDocuments'
import { useEmployeeAttachments, useUploadEmployeeAttachment, useDeleteEmployeeAttachment, useDownloadEmployeeAttachment } from '@/hooks/useEmployeeAttachments'
import { EmergencyContactFormModal } from './EmergencyContactFormModal'
import { uploadEmployeePhoto, deleteEmployeePhoto } from '@/lib/supabase/storage'
import { logAction } from '@/services/auditLog.service'
import { toast } from 'sonner'

type TabKey = 'personal' | 'contact' | 'employment' | 'emergency' | 'dependents' | 'banking' | 'benefits' | 'immigration' | 'assets' | 'qualifications' | 'security'

export function EmployeeDetailContent({
  backHref = '/employees',
  overrideEmployeeId,
  hideBackButton = false,
  readOnly = false,
}: {
  backHref?: string
  overrideEmployeeId?: string
  hideBackButton?: boolean
  readOnly?: boolean
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
  const isAdmin = roleInfo?.role_name === 'Admin' || roleInfo?.role_name === 'Administrative Manager' || roleInfo?.role_name === 'Administrative Assistant'

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
        data: cleanData
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
      // Delete old photo if exists
      if (employee.avatar_url) {
        try {
          await deleteEmployeePhoto(employee.avatar_url)
        } catch (error) {
          console.error('Error deleting old photo:', error)
          // Continue with upload even if delete fails
        }
      }

      // Upload new photo
      const photoUrl = await uploadEmployeePhoto(file, employee.employee_id)

      // Update employee with new photo URL
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: { avatar_url: photoUrl }
      })

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
      await deleteEmployeePhoto(employee.avatar_url)
      
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: { avatar_url: null }
      })

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
              <div className="grid grid-cols-[1fr_1fr_1fr_120px] gap-4">
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
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
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
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value="male"
                        checked={formData.sex === 'male'}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                        disabled={!isEditMode}
                        className="h-4 w-4 text-orange focus:ring-orange border-gray-300 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">Male</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value="female"
                        checked={formData.sex === 'female'}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                        disabled={!isEditMode}
                        className="h-4 w-4 text-orange focus:ring-orange border-gray-300 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">Female</span>
                    </label>
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
                    type="number"
                    value={formData.national_id} 
                    onChange={(e) => handleInputChange('national_id', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="Voter's ID" 
                    type="number"
                    value={formData.voters_id} 
                    onChange={(e) => handleInputChange('voters_id', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="Pag-IBIG Number" 
                    type="number"
                    value={formData.pagibig_number} 
                    onChange={(e) => handleInputChange('pagibig_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="PhilHealth Number" 
                    type="number"
                    value={formData.philhealth_number} 
                    onChange={(e) => handleInputChange('philhealth_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="SSS Number" 
                    type="number"
                    value={formData.sss_number} 
                    onChange={(e) => handleInputChange('sss_number', e.target.value)}
                    disabled={!isEditMode} 
                  />
                  <Input 
                    label="TIN Number" 
                    type="number"
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
                          description: 'Emergency contact document'
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
                    disabled={uploadEmployeeAttachment.isPending || !isAdmin}
                    className={`cursor-pointer flex flex-col items-center w-full ${(uploadEmployeeAttachment.isPending || !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange/10 rounded-lg">
                <Shield className="w-5 h-5 text-orange" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Benefits & Insurance</h3>
                <p className="text-sm text-gray-500 mt-1">Health insurance, retirement plans, and other benefits</p>
              </div>
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Benefits & Insurance module coming soon</p>
              <p className="text-sm text-gray-400 mt-1">This section will display health, life insurance, and retirement plan details once the module is configured.</p>
            </div>
          </div>
        )
      
      case 'immigration':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange/10 rounded-lg">
                <Plane className="w-5 h-5 text-orange" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Immigration Documents</h3>
                <p className="text-sm text-gray-500 mt-1">Passport, visa, and work permit information</p>
              </div>
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Plane className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Immigration module coming soon</p>
              <p className="text-sm text-gray-400 mt-1">This section will display passport, visa, and work permit information once the module is configured.</p>
            </div>
          </div>
        )
      
      case 'assets':
        return (
          <div className="space-y-4">
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
              <Button variant="secondary" size="sm">Assign Asset</Button>
            </div>
            <div className="border-t border-gray-200 mb-6"></div>
            <p className="text-gray-500 text-center py-8">No assets assigned yet.</p>
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
      
      case 'security':
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
            <div className="border-t border-gray-200 mb-6"></div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                <Badge variant="warning">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Last Password Change</span>
                <span className="text-sm text-gray-600">Never</span>
              </div>
              <Button variant="secondary" size="sm" className="mt-4">Reset Password</Button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideBackButton && (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
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

      {/* Profile Summary Card */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0 group">
            <Avatar
              src={employee.avatar_url}
              firstName={employee.first_name}
              lastName={employee.last_name}
              size="xl"
            />
            {isAdmin && !readOnly && (
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all cursor-pointer"
                title="Change photo"
              >
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
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
              <div className="text-sm font-medium text-gray-900">
                {employee.hire_date ? (() => {
                  const start = new Date(employee.hire_date)
                  const now = new Date()
                  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
                  const y = Math.floor(months / 12)
                  const m = months % 12
                  if (y === 0) return `${m}mo`
                  if (m === 0) return `${y}yr${y > 1 ? 's' : ''}`
                  return `${y}yr${y > 1 ? 's' : ''} ${m}mo`
                })() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
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

        {/* Tab Content */}
        <div className="flex-1">
          <Card>
            {renderTabContent()}
          </Card>
        </div>
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


