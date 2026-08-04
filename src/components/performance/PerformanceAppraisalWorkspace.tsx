'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, FilePlus2, Save, HelpCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import { Button, Card, Input, Select, Badge } from '@/components/ui'
import {
  useMyPerformanceAppraisals,
  useSavePerformanceAppraisalDraft,
  useSubmitPerformanceAppraisal,
  useCurrentEmployee,
  useEmployeeAttachments,
} from '@/hooks'
import type { PerformanceAppraisalRecord } from '@/services'
import { createClient } from '@/lib/supabase/client'

type PeriodCovered = 'midyear' | 'yearend'
type AppraisalStatus = 'draft' | 'pending_review' | 'in_review' | 'returned' | 'completed'

type ObjectiveRow = {
  objective: string
  status: string
  comments: string
}

type PlanRow = {
  objective: string
  criteria: string
}

type SavedAppraisal = {
  id: string
  createdAt: string
  updatedAt: string
  status: AppraisalStatus
  periodCovered: PeriodCovered
  appraiseeName: string
  filename: string
  form: AppraisalFormState
  returnComment?: string
}

type AppraisalFormState = {
  appraiseeName: string
  appraiserName: string
  department: string
  position: string
  timeInPresentPosition: string
  lengthOfService: string
  periodCovered: PeriodCovered
  appraisalDate: string
  discussionPoints: string[]
  objectives: ObjectiveRow[]
  workRatings: Record<string, string>
  problemsFaced: string
  supervisorFeedback: string
  overallRating: string
  recommendation: string
  trainingDevelopmentAims: string
  trainingSupport: string
  performancePlan: PlanRow[]
  managementActionSummary: string
  confidentialityNotes: string
  appraiserSignature: string
  appraiserSignedDate: string
  appraiseeSignature: string
  appraiseeSignedDate: string
}

const DRAFT_STORAGE_KEY = 'performance-appraisal-draft-v1'

const DISCUSSION_PROMPTS = [
  'What do you consider to be your most important achievements of the past year?',
  'What do you like and dislike about working for this organisation?',
  'What elements of your job interest you the most, and least?',
  'What elements of your job do you find most manageable, and most difficult?',
  'What action could be taken to improve your performance in your current position by you and your supervisor?',
  'What kind of work or job would you like to be doing in one/two/five years time?',
  'Other issues you would like to raise that affect your performance.',
]

const WORK_RATING_AREAS = [
  'Communication skills (written and oral)',
  'Decision making ability and problem-solving skills',
  'Time management (meeting deadlines/commitments)',
  'Planning, budgeting and forecasting',
  'Organizational ability (reporting and administration)',
  'Analytical skill',
  'IT/equipment/machinery skills',
  'Creativity',
  'Delegation skills, team-working, and developing others',
  'Energy, determination and work-rate',
  'Leadership and integrity',
  'Adaptability, flexibility, and mobility; steadiness under pressure',
  'Work attitude and ethics',
  'Staff relations',
  'Compliance with institutional policies and procedures',
]

const WORK_RATING_CATEGORIES = {
  'Knowledge and Skills': [
    'Communication skills (written and oral)',
    'Decision making ability and problem-solving skills',
    'Time management (meeting deadlines/commitments)',
    'Planning, budgeting and forecasting',
    'Organizational ability (reporting and administration)',
    'Analytical skill',
    'IT/equipment/machinery skills',
    'Creativity',
    'Delegation skills, team-working, and developing others',
    'Energy, determination and work-rate',
    'Leadership and integrity',
    'Adaptability, flexibility, and mobility; steadiness under pressure',
  ],
  'Attitude and Behavior': [
    'Work attitude and ethics',
    'Staff relations',
    'Compliance with institutional policies and procedures',
  ],
}

const emptyObjective = (): ObjectiveRow => ({ objective: '', status: 'on_track', comments: '' })
const emptyPlan = (): PlanRow => ({ objective: '', criteria: '' })

const defaultFormState = (
  initialAppraiseeName: string,
  initialAppraiserName = '',
  initialDepartment = '',
  initialPosition = '',
  initialTimeInPresentPosition = '',
  initialLengthOfService = '',
): AppraisalFormState => ({
  appraiseeName: initialAppraiseeName,
  appraiserName: initialAppraiserName,
  department: initialDepartment,
  position: initialPosition,
  timeInPresentPosition: initialTimeInPresentPosition,
  lengthOfService: initialLengthOfService,
  periodCovered: 'midyear',
  appraisalDate: new Date().toISOString().slice(0, 10),
  discussionPoints: Array(DISCUSSION_PROMPTS.length).fill(''),
  objectives: [emptyObjective()],
  workRatings: {},
  problemsFaced: '',
  supervisorFeedback: '',
  overallRating: 'good',
  recommendation: '',
  trainingDevelopmentAims: '',
  trainingSupport: '',
  performancePlan: [emptyPlan(), emptyPlan(), emptyPlan()],
  managementActionSummary: '',
  confidentialityNotes: '',
  appraiserSignature: '',
  appraiserSignedDate: '',
  appraiseeSignature: '',
  appraiseeSignedDate: '',
})

const statusLabelMap: Record<AppraisalStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  in_review: 'In Review',
  returned: 'Returned',
  completed: 'Completed',
}

const statusVariantMap: Record<AppraisalStatus, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  draft: 'default',
  pending_review: 'warning',
  in_review: 'info',
  returned: 'danger',
  completed: 'success',
}

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const textAreaClassName = 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

interface PerformanceAppraisalWorkspaceProps {
  initialAppraiseeName?: string
  initialAppraiserName?: string
  initialDepartment?: string
  initialPosition?: string
  initialTimeInPresentPosition?: string
  initialLengthOfService?: string
  storageScopeKey?: string
}

export default function PerformanceAppraisalWorkspace({
  initialAppraiseeName = '',
  initialAppraiserName = '',
  initialDepartment = '',
  initialPosition = '',
  initialTimeInPresentPosition = '',
  initialLengthOfService = '',
  storageScopeKey = 'anonymous',
}: PerformanceAppraisalWorkspaceProps) {
  const [form, setForm] = useState<AppraisalFormState>(() => defaultFormState(
    initialAppraiseeName,
    initialAppraiserName,
    initialDepartment,
    initialPosition,
    initialTimeInPresentPosition,
    initialLengthOfService,
  ))
  const [activeFormId, setActiveFormId] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const { data: savedRecords = [] } = useMyPerformanceAppraisals()
  const saveDraftMutation = useSavePerformanceAppraisalDraft()
  const submitMutation = useSubmitPerformanceAppraisal()
  const draftStorageKey = `${DRAFT_STORAGE_KEY}:${storageScopeKey}`

  useEffect(() => {
    const storedDraft = safeJsonParse<AppraisalFormState | null>(localStorage.getItem(draftStorageKey), null)

    if (storedDraft) {
      const base = defaultFormState(
        initialAppraiseeName,
        initialAppraiserName,
        initialDepartment,
        initialPosition,
        initialTimeInPresentPosition,
        initialLengthOfService,
      )
      setForm({
        ...base,
        ...storedDraft,
        appraiseeName: storedDraft.appraiseeName || initialAppraiseeName,
        appraiserName: storedDraft.appraiserName || initialAppraiserName,
        department: storedDraft.department || initialDepartment,
        position: storedDraft.position || initialPosition,
        timeInPresentPosition: storedDraft.timeInPresentPosition || initialTimeInPresentPosition,
        lengthOfService: storedDraft.lengthOfService || initialLengthOfService,
      })
    } else {
      setForm(defaultFormState(
        initialAppraiseeName,
        initialAppraiserName,
        initialDepartment,
        initialPosition,
        initialTimeInPresentPosition,
        initialLengthOfService,
      ))
    }
  }, [
    initialAppraiseeName,
    initialAppraiserName,
    initialDepartment,
    initialPosition,
    initialTimeInPresentPosition,
    initialLengthOfService,
    draftStorageKey,
  ])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(draftStorageKey, JSON.stringify(form))
      setLastSavedAt(new Date().toISOString())
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [form, draftStorageKey])

  // ── Auto-populate e-signatures from employee profiles ──
  const { data: currentEmployee } = useCurrentEmployee()
  const employeeId = currentEmployee?.id || currentEmployee?.employee_id
  const { data: attachments = [] } = useEmployeeAttachments(employeeId || '')
  const [signaturesLoaded, setSignaturesLoaded] = useState(false)

  useEffect(() => {
    if (!employeeId || signaturesLoaded) return

    const fetchSignatures = async () => {
      const supabase = createClient()
      
      // Fetch current employee's e-signature
      const employeeSignatureAttachment = attachments.find(a => a.document_type === 'e-signature')
      
      if (employeeSignatureAttachment?.file_path) {
        try {
          const { data: signedUrl, error } = await supabase.storage
            .from('attachments')
            .createSignedUrl(employeeSignatureAttachment.file_path, 3600)
          
          if (!error && signedUrl?.signedUrl) {
            setForm(prev => {
              if (prev.appraiseeSignature?.startsWith('http')) return prev
              return { ...prev, appraiseeSignature: signedUrl.signedUrl }
            })
          }
        } catch (err) {
          console.error('Failed to fetch employee e-signature:', err)
        }
      }

      // Fetch manager's e-signature if manager_id exists
      if (currentEmployee?.manager_id) {
        try {
          // Fetch manager employee record
          const { data: manager, error: managerError } = await supabase
            .from('employees')
            .select('id')
            .eq('id', currentEmployee.manager_id)
            .single()
          
          if (!managerError && manager) {
            // Fetch manager's attachments
            const { data: managerAttachments, error: attachError } = await supabase
              .from('employee_attachments')
              .select('file_path, document_type')
              .eq('employee_id', manager.id)
              .eq('document_type', 'e-signature')
            
            if (!attachError && managerAttachments?.[0]?.file_path) {
              const { data: managerSignedUrl, error: signError } = await supabase.storage
                .from('attachments')
                .createSignedUrl(managerAttachments[0].file_path, 3600)
              
              if (!signError && managerSignedUrl?.signedUrl) {
                setForm(prev => {
                  if (prev.appraiserSignature?.startsWith('http')) return prev
                  return { ...prev, appraiserSignature: managerSignedUrl.signedUrl }
                })
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch manager e-signature:', err)
        }
      }

      setSignaturesLoaded(true)
    }

    if (attachments.length >= 0) {
      fetchSignatures()
    }
  }, [employeeId, currentEmployee?.manager_id, signaturesLoaded, attachments])

  const mapRecordToSaved = (record: PerformanceAppraisalRecord): SavedAppraisal => {
    const parsedForm = (record.form_data ?? {}) as Partial<AppraisalFormState>
    const resolvedAppraiserName = record.appraiser
      ? `${record.appraiser.first_name || ''} ${record.appraiser.last_name || ''}`.trim()
      : ''
    const mergedForm: AppraisalFormState = {
      ...defaultFormState(
        initialAppraiseeName,
        initialAppraiserName,
        initialDepartment,
        initialPosition,
        initialTimeInPresentPosition,
        initialLengthOfService,
      ),
      ...parsedForm,
      appraiserName: parsedForm.appraiserName || resolvedAppraiserName || initialAppraiserName,
    }

    return {
      id: record.id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      status: record.status,
      periodCovered: record.period_covered,
      appraiseeName: mergedForm.appraiseeName,
      filename: record.filename,
      form: mergedForm,
      returnComment: typeof record.form_data?.admin_return_comment === 'string' ? record.form_data.admin_return_comment : undefined,
    }
  }

  const listPreview = useMemo(() => {
    return savedRecords.map(mapRecordToSaved).map((entry) => ({
      ...entry,
      periodLabel: entry.periodCovered === 'midyear' ? 'Midyear (January to June)' : 'Yearend (January to December)',
      displayDate: new Date(entry.updatedAt).toLocaleDateString(),
    }))
  }, [
    savedRecords,
    initialAppraiseeName,
    initialAppraiserName,
    initialDepartment,
    initialPosition,
    initialTimeInPresentPosition,
    initialLengthOfService,
  ])

  const saveAsDraft = async () => {
    try {
      const reviewYear = Number((form.appraisalDate || '').slice(0, 4)) || new Date().getFullYear()
      const saved = await saveDraftMutation.mutateAsync({
        id: activeFormId ?? undefined,
        periodCovered: form.periodCovered,
        reviewYear,
        formData: form,
      })
      setActiveFormId(saved.id)
    } catch {
      // Error toast is handled in the mutation hook.
    }
  }

  const submitForReview = async () => {
    if (!form.appraiseeName) {
      toast.error('Please complete appraisee name before submitting')
      return
    }

    try {
      const reviewYear = Number((form.appraisalDate || '').slice(0, 4)) || new Date().getFullYear()
      const submitted = await submitMutation.mutateAsync({
        id: activeFormId ?? undefined,
        periodCovered: form.periodCovered,
        reviewYear,
        formData: form,
      })
      setActiveFormId(submitted.id)
    } catch {
      // Error toast is handled in the mutation hook.
    }
  }

  const clearForNew = () => {
    const fresh = defaultFormState(
      initialAppraiseeName,
      initialAppraiserName,
      initialDepartment,
      initialPosition,
      initialTimeInPresentPosition,
      initialLengthOfService,
    )
    setForm(fresh)
    setActiveFormId(null)
    localStorage.setItem(draftStorageKey, JSON.stringify(fresh))
    toast.success('Started a new appraisal form')
  }

  const loadEntry = (entry: SavedAppraisal) => {
    setForm(entry.form)
    setActiveFormId(entry.id)
    localStorage.setItem(draftStorageKey, JSON.stringify(entry.form))
    if (entry.returnComment) {
      toast(`Admin note: ${entry.returnComment}`)
    }
    toast.success(`Loaded ${entry.filename}`)
  }

  const downloadEntry = async (entry: SavedAppraisal) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    let y = 0

    // Color palette
    const colors = {
      primary: '#22c55e',
      secondary: '#0891b2',
      accent: '#f59e0b',
      dark: '#1f2937',
      light: '#f3f4f6',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#ef4444',
    }

    // Helper: Convert hex to RGB and set fill color
    const setColorFill = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (result) {
        doc.setFillColor(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16))
      }
    }

    // Helper: Convert hex to RGB and set text color
    const setColorText = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (result) {
        doc.setTextColor(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16))
      }
    }

    // Helper: Convert hex to RGB and set draw color
    const setColorDraw = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (result) {
        doc.setDrawColor(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16))
      }
    }

    // Helper: Convert hex to RGB array
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
    }

    // Helper: Load image from URL to base64
    const loadImageAsBase64 = async (url: string): Promise<string | null> => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      } catch {
        return null
      }
    }

    // Helper: Add page header with logo
    const addPageHeader = async (isFirstPage = true) => {
      if (!isFirstPage) return

      // Modern gradient background effect with shapes
      setColorFill(colors.primary)
      doc.rect(0, 0, pageWidth, 50, 'F')

      // Accent stripe
      setColorFill(colors.secondary)
      doc.rect(0, 48, pageWidth, 4, 'F')

      // Load and add logo
      try {
        const logoBase64 = await loadImageAsBase64('/Users/leopura/Desktop/iiadminsystem/public/ibon-logo.png')
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 10, 8, 20, 20)
        }
      } catch {
        // Logo loading failed, continue
      }

      // Company branding
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)
      doc.text('IBON International', 35, 18)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(220, 220, 220)
      doc.text('Performance Appraisal Form', 35, 28)

      // Date in top right
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(200, 200, 200)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 45, 25)

      y = 58
    }

    // Helper: Add employee card with photo
    const addEmployeeCard = async () => {
      // Card background
      setColorFill(colors.light)
      doc.roundedRect(10, y, pageWidth - 20, 45, 3, 3, 'F')

      // Left side: Employee info
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      setColorText(colors.dark)
      doc.text(entry.form.appraiseeName, 15, y + 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setColorText(colors.dark)
      doc.text(`Position: ${entry.form.position}`, 15, y + 20)
      doc.text(`Department: ${entry.form.department}`, 15, y + 26)
      doc.text(`Period: ${entry.form.periodCovered === 'yearend' ? 'Yearend' : 'Midyear'} | Date: ${entry.form.appraisalDate}`, 15, y + 32)

      // Right side: Photo
      const supabase = createClient()
      try {
        const { data: attachments } = await supabase
          .from('employee_attachments')
          .select('file_url')
          .eq('employee_id', entry.form.appraiseeName.toLowerCase())
          .eq('attachment_type', 'photo')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (attachments?.file_url) {
          const photoBase64 = await loadImageAsBase64(attachments.file_url)
          if (photoBase64) {
            // Create circular mask effect with border
            setColorDraw(colors.primary)
            doc.setLineWidth(0.5)
            doc.circle(pageWidth - 25, y + 22, 18, 'S')
            doc.addImage(photoBase64, 'JPEG', pageWidth - 42, y + 4, 34, 36)
          }
        }
      } catch {
        // Photo not found
      }

      y += 52
    }

    // Helper: Section header with icon-style indicator
    const addSectionHeader = (title: string, number?: string) => {
      // Subtle background
      setColorFill(colors.light)
      doc.rect(10, y, pageWidth - 20, 10, 'F')

      // Left colored bar
      setColorFill(colors.primary)
      doc.rect(10, y, 2, 10, 'F')

      // Section number badge
      if (number) {
        setColorFill(colors.secondary)
        doc.circle(16, y + 5, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(255, 255, 255)
        doc.text(number, 15, y + 6)
      }

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      setColorText(colors.dark)
      doc.text(title, 25, y + 6.5)

      y += 14
    }

    // Helper: Content paragraph
    const addParagraph = (label: string, value: string, indent = 5) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      setColorText(colors.secondary)
      doc.text(label + ':', 10 + indent, y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      setColorText(colors.dark)
      const lines = doc.splitTextToSize(value || '—', pageWidth - 30 - indent)
      doc.text(lines, 15 + indent, y + 4)

      y += Math.max(lines.length * 3.5 + 5, 8)
    }

    // Helper: Ratings table
    const addRatingsTable = (ratings: Record<string, string>) => {
      const tableY = y
      const colWidth = (pageWidth - 20) / 2
      const cellHeight = 5

      // Headers
      setColorFill(colors.secondary)
      doc.rect(10, tableY, colWidth, cellHeight, 'F')
      doc.rect(10 + colWidth, tableY, colWidth, cellHeight, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('Area', 12, tableY + 3.5)
      doc.text('Rating', 12 + colWidth, tableY + 3.5)

      y = tableY + cellHeight

      // Data rows
      let rowIndex = 0
      Object.entries(ratings).forEach(([area, rating]) => {
        const bgColor = rowIndex % 2 === 0 ? colors.light : '#ffffff'
        setColorFill(bgColor)
        doc.rect(10, y, pageWidth - 20, cellHeight, 'F')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        setColorText(colors.dark)
        const areaLines = doc.splitTextToSize(area, colWidth - 4)
        doc.text(areaLines, 12, y + 2)
        doc.text(rating, 12 + colWidth, y + 2)

        y += cellHeight
        rowIndex++
      })

      y += 3
    }

    // Helper: Overall rating badge
    const addRatingBadge = (label: string, rating: string) => {
      const badgeY = y

      // Background
      setColorFill(colors.light)
      doc.roundedRect(10, badgeY, pageWidth - 20, 12, 2, 2, 'F')

      // Rating color based on value
      let ratingColor = colors.success
      if (rating.toLowerCase().includes('poor')) ratingColor = colors.warning
      else if (rating.toLowerCase().includes('satisfactory')) ratingColor = colors.accent
      else if (rating.toLowerCase().includes('excellent')) ratingColor = colors.primary

      setColorFill(ratingColor)
      doc.circle(pageWidth - 20, badgeY + 6, 5, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text(rating.toUpperCase(), pageWidth - 20, badgeY + 7.5)

      // Label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      setColorText(colors.dark)
      doc.text(label, 15, badgeY + 8)

      y += 16
    }

    // Helper: Ensure page space
    const ensureSpace = (needed = 20) => {
      if (y + needed > pageHeight - 20) {
        // Add footer
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
        doc.addPage()
        y = 15
      }
    }

    // Build PDF
    await addPageHeader(true)
    await addEmployeeCard()
    ensureSpace(15)

    // Basic Info Section
    addSectionHeader('Employee Information', 'I')
    addParagraph('Appraiser', entry.form.appraiserName)
    addParagraph('Time in Position', entry.form.timeInPresentPosition)
    addParagraph('Service Length', entry.form.lengthOfService)
    if (entry.returnComment) {
      setColorFill(colors.warning)
      doc.rect(10, y, pageWidth - 20, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('⚠ Admin Note: ' + entry.returnComment, 12, y + 4)
      y += 10
    }
    y += 3

    ensureSpace(15)

    // Discussion Points
    addSectionHeader('Discussion Points', 'II')
    DISCUSSION_PROMPTS.forEach((prompt, idx) => {
      ensureSpace(8)
      addParagraph(`${idx + 1}. ${prompt}`, entry.form.discussionPoints[idx] || '—')
    })
    y += 2

    ensureSpace(15)

    // Performance Assessment
    addSectionHeader('Performance Assessment', 'III')
    entry.form.objectives.forEach((objective, idx) => {
      ensureSpace(8)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setColorText(colors.secondary)
      doc.text(`Objective ${idx + 1}`, 15, y)
      y += 3.5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      setColorText(colors.dark)
      const objLines = doc.splitTextToSize(objective.objective || '—', pageWidth - 30)
      doc.text(objLines, 18, y)
      y += objLines.length * 2.8 + 2

      const statusColor = objective.status?.includes('achieved') ? colors.success : colors.accent
      setColorFill(statusColor)
      doc.rect(18, y, 40, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(255, 255, 255)
      doc.text(objective.status?.toUpperCase() || '—', 20, y + 2.5)
      y += 6
    })
    y += 2

    ensureSpace(15)

    // Work Ratings
    addSectionHeader('Work Ratings', 'IV')
    const flatRatings = Object.entries(WORK_RATING_CATEGORIES).reduce((acc, [_, areas]) => {
      areas.forEach((area) => {
        acc[area] = entry.form.workRatings[area] || 'good'
      })
      return acc
    }, {} as Record<string, string>)
    addRatingsTable(flatRatings)
    y += 3

    ensureSpace(15)

    // Problems & Insights
    addSectionHeader('Performance Insights', 'V')
    addParagraph('Challenges', entry.form.problemsFaced || '—')
    addParagraph('Supervisor Feedback', entry.form.supervisorFeedback || '—')
    y += 2

    ensureSpace(12)

    // Overall Rating
    addRatingBadge('Overall Performance Rating', entry.form.overallRating)
    if (entry.form.recommendation) {
      addParagraph('Recommendation', entry.form.recommendation)
    }

    ensureSpace(15)

    // Training & Development
    addSectionHeader('Development Plan', 'VI')
    addParagraph('Development Aims', entry.form.trainingDevelopmentAims || '—')
    addParagraph('Support Required', entry.form.trainingSupport || '—')
    y += 3

    ensureSpace(15)

    // Performance Plan
    addSectionHeader('Performance Plan', 'VII')
    entry.form.performancePlan.forEach((plan, idx) => {
      if (plan.objective || plan.criteria) {
        ensureSpace(8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        setColorText(colors.secondary)
        doc.text(`Plan ${idx + 1}`, 15, y)
        y += 3.5

        addParagraph('Objective', plan.objective || '—', 8)
        addParagraph('Criteria', plan.criteria || '—', 8)
      }
    })
    y += 2

    ensureSpace(15)

    // Management Action
    addSectionHeader('Management Action', 'VIII')
    addParagraph('Summary', entry.form.managementActionSummary || '—')
    addParagraph('Confidentiality Notes', entry.form.confidentialityNotes || '—')
    y += 3

    ensureSpace(20)

    // Signatures Section
    addSectionHeader('Signatures & Approvals', 'IX')
    
    const formatSig = (sig: string | undefined) => (sig?.startsWith('http') ? '[E-Signature]' : sig || '___________________')
    
    // Appraiser
    setColorFill(colors.light)
    doc.rect(10, y, pageWidth / 2 - 12, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColorText(colors.dark)
    doc.text('Appraiser', 15, y + 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(entry.form.appraiserName, 15, y + 9)
    doc.text('Signature: ' + formatSig(entry.form.appraiserSignature), 15, y + 13)
    doc.text('Date: ' + (entry.form.appraiserSignedDate || '_________'), 15, y + 17)

    // Appraisee
    setColorFill(colors.light)
    doc.rect(pageWidth / 2 + 2, y, pageWidth / 2 - 12, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColorText(colors.dark)
    doc.text('Appraisee', pageWidth / 2 + 7, y + 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(entry.form.appraiseeName, pageWidth / 2 + 7, y + 9)
    doc.text('Signature: ' + formatSig(entry.form.appraiseeSignature), pageWidth / 2 + 7, y + 13)
    doc.text('Date: ' + (entry.form.appraiseeSignedDate || '_________'), pageWidth / 2 + 7, y + 17)

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
    doc.text('© IBON International | Confidential', 10, pageHeight - 4)

    doc.save(`${entry.filename}.pdf`)
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Performance Appraisal Form</h2>
            <p className="text-sm text-gray-500 mt-1">Online form based on your standard appraisal template with draft and autosave support.</p>
            <p className="text-xs text-gray-400 mt-1">{lastSavedAt ? `Auto-saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Autosave starts as you type'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={clearForNew}>
              <FilePlus2 className="w-4 h-4" />
              New Form
            </Button>
            <Button variant="outline" size="sm" onClick={saveAsDraft}>
              <Save className="w-4 h-4" />
              Save as Draft
            </Button>
            <Button size="sm" onClick={submitForReview}>Submit for Review</Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name of Appraisee" value={form.appraiseeName} onChange={(e) => setForm((prev) => ({ ...prev, appraiseeName: e.target.value }))} />
          <Input
            label="Name of Appraiser"
            value={form.appraiserName}
            readOnly
            placeholder="Auto-assigned from your manager"
            helpText="This field is auto-assigned to your manager. HR/Admin can override if needed."
          />
          <Input label="Department" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
          <Input label="Position" value={form.position} onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))} />
          <Input label="Time in Present Position" value={form.timeInPresentPosition} onChange={(e) => setForm((prev) => ({ ...prev, timeInPresentPosition: e.target.value }))} />
          <Input label="Length of Service" value={form.lengthOfService} onChange={(e) => setForm((prev) => ({ ...prev, lengthOfService: e.target.value }))} />
          <Select
            label="Period Covered"
            value={form.periodCovered}
            onChange={(e) => setForm((prev) => ({ ...prev, periodCovered: e.target.value as PeriodCovered }))}
            options={[
              { value: 'midyear', label: 'Midyear (January to June)' },
              { value: 'yearend', label: 'Yearend (January to December)' },
            ]}
          />
          <Input
            label="Appraisal Date"
            type="date"
            value={form.appraisalDate}
            onChange={(e) => setForm((prev) => ({ ...prev, appraisalDate: e.target.value }))}
          />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part I: Discussion Points</h3>
        <p className="text-sm text-gray-500">To be completed by staff before discussion with the appraiser.</p>
        {DISCUSSION_PROMPTS.map((prompt, idx) => (
          <div key={prompt} className="space-y-1">
            <p className="text-sm text-gray-700">{idx + 1}. {prompt}</p>
            <textarea
              rows={3}
              className={textAreaClassName}
              value={form.discussionPoints[idx] || ''}
              onChange={(e) =>
                setForm((prev) => {
                  const next = [...prev.discussionPoints]
                  next[idx] = e.target.value
                  return { ...prev, discussionPoints: next }
                })
              }
            />
          </div>
        ))}
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part II: Performance Assessment</h3>
        <p className="text-sm text-gray-600">To be completed by Appraisee in discussion with the Appraiser</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-green-100 border-b border-gray-200">Objective/s</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-green-100 border-b border-gray-200">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-green-100 border-b border-gray-200">Comments</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900 bg-green-100 border-b border-gray-200 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-xs text-gray-600">
                  <div className="space-y-1">
                    <p><strong>Note:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>For <u>midyear assessment</u>, list the objectives you aimed to achieve during the appraisal period and assess or evaluate whether the status of the objectives are <strong>on-track</strong> or <strong>delayed</strong>.</li>
                      <li>For <u>yearend assessment</u>, list the objectives you aimed to achieve during the appraisal period and assess or evaluate whether the status of the objectives are <strong>achieved, partly achieved</strong>, or <strong>not achieved</strong> at all.</li>
                    </ul>
                  </div>
                </td>
              </tr>
              {form.objectives.map((item, index) => (
                <tr key={`objective-${index}`}>
                  <td className="px-4 py-3 text-gray-700">
                    <Input
                      value={item.objective}
                      placeholder={`Objective ${index + 1}`}
                      onChange={(e) =>
                        setForm((prev) => {
                          const objectives = [...prev.objectives]
                          objectives[index] = { ...objectives[index], objective: e.target.value }
                          return { ...prev, objectives }
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3 w-40">
                    <Select
                      value={item.status}
                      onChange={(e) =>
                        setForm((prev) => {
                          const objectives = [...prev.objectives]
                          objectives[index] = { ...objectives[index], status: e.target.value }
                          return { ...prev, objectives }
                        })
                      }
                      options={[
                        { value: 'on_track', label: 'On Track' },
                        { value: 'delayed', label: 'Delayed' },
                        { value: 'achieved', label: 'Achieved' },
                        { value: 'partly_achieved', label: 'Partly Achieved' },
                        { value: 'not_achieved', label: 'Not Achieved' },
                      ]}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={item.comments}
                      placeholder="Comments"
                      onChange={(e) =>
                        setForm((prev) => {
                          const objectives = [...prev.objectives]
                          objectives[index] = { ...objectives[index], comments: e.target.value }
                          return { ...prev, objectives }
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {form.objectives.length > 1 && (
                      <button
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            objectives: prev.objectives.filter((_, i) => i !== index),
                          }))
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete objective"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              objectives: [...prev.objectives, emptyObjective()],
            }))
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add More Objective
        </button>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-blue-100 border-b border-gray-200">Work Areas</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-blue-100 border-b border-gray-200">Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-4 py-3 text-xs text-gray-600">
                    <p><strong>Note:</strong> Based on the performance assessment above, rate your knowledge, skills and attitude on the following work areas (poor, satisfactory, good, excellent). Discuss and finalise the rating with the appraiser.</p>
                  </td>
                </tr>
                {Object.entries(WORK_RATING_CATEGORIES).map(([category, areas]) => (
                  <>
                    <tr key={category}>
                      <td colSpan={2} className="px-4 py-2 bg-blue-200 font-semibold text-gray-900 border-b border-gray-200">
                        {category}
                      </td>
                    </tr>
                    {areas.map((area) => (
                      <tr key={area} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-gray-700">{area}</td>
                        <td className="px-4 py-3 w-40">
                          <Select
                            value={form.workRatings[area] || 'good'}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                workRatings: { ...prev.workRatings, [area]: e.target.value },
                              }))
                            }
                            options={[
                              { value: 'poor', label: 'Poor' },
                              { value: 'satisfactory', label: 'Satisfactory' },
                              { value: 'good', label: 'Good' },
                              { value: 'excellent', label: 'Excellent' },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-6 mt-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Problems faced and how they were resolved</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.problemsFaced}
              onChange={(e) => setForm((prev) => ({ ...prev, problemsFaced: e.target.value }))}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Feedback on supervisor role</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.supervisorFeedback}
              onChange={(e) => setForm((prev) => ({ ...prev, supervisorFeedback: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Overall Rating</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Overall Rating"
            value={form.overallRating}
            onChange={(e) => setForm((prev) => ({ ...prev, overallRating: e.target.value }))}
            options={[
              { value: 'poor', label: 'Poor' },
              { value: 'satisfactory', label: 'Satisfactory' },
              { value: 'good', label: 'Good' },
              { value: 'excellent', label: 'Excellent' },
            ]}
          />
          <Input label="Recommendation" value={form.recommendation} onChange={(e) => setForm((prev) => ({ ...prev, recommendation: e.target.value }))} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part IV: Training and Staff Development</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Agreed development aims</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.trainingDevelopmentAims}
              onChange={(e) => setForm((prev) => ({ ...prev, trainingDevelopmentAims: e.target.value }))}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Training and development support to be provided</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.trainingSupport}
              onChange={(e) => setForm((prev) => ({ ...prev, trainingSupport: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part V: Performance Plan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Objective</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Criteria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {form.performancePlan.map((item, index) => (
                <tr key={`plan-${index}`}>
                  <td className="p-2">
                    <Input
                      value={item.objective}
                      onChange={(e) =>
                        setForm((prev) => {
                          const performancePlan = [...prev.performancePlan]
                          performancePlan[index] = { ...performancePlan[index], objective: e.target.value }
                          return { ...prev, performancePlan }
                        })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.criteria}
                      onChange={(e) =>
                        setForm((prev) => {
                          const performancePlan = [...prev.performancePlan]
                          performancePlan[index] = { ...performancePlan[index], criteria: e.target.value }
                          return { ...prev, performancePlan }
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part VI: Management Action</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Grade, recommendation, summary</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.managementActionSummary}
              onChange={(e) => setForm((prev) => ({ ...prev, managementActionSummary: e.target.value }))}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Notes on copies, confidentiality, accessibility</p>
            <textarea
              rows={3}
              className={textAreaClassName}
              value={form.confidentialityNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, confidentialityNotes: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Signatures</h3>
        <div className="grid grid-cols-2 gap-8">
          {/* First Column - Employee/Appraisee */}
          <div className="space-y-3 text-center">
            {/* Signature Display */}
            <div className="py-4 min-h-12">
              {form.appraiseeSignature && form.appraiseeSignature.startsWith('http') && (
                <img src={form.appraiseeSignature} alt="Employee signature" className="max-h-20 max-w-full mx-auto" />
              )}
            </div>
            {/* Appraisee Name */}
            <p className="text-sm font-semibold text-gray-900">{form.appraiseeName}</p>
            {/* Appraisee Label */}
            <p className="text-xs text-gray-600">Appraisee</p>
            {/* Date field */}
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={form.appraiseeSignedDate}
              onChange={(e) => setForm((prev) => ({ ...prev, appraiseeSignedDate: e.target.value }))}
              className="bg-transparent border-0 border-b border-gray-300 text-center text-sm placeholder:text-gray-400 focus:outline-none focus:border-b focus:border-gray-600"
            />
          </div>

          {/* Second Column - Manager/Appraiser */}
          <div className="space-y-3 text-center">
            {/* Signature Display */}
            <div className="py-4 min-h-12">
              {form.appraiserSignature && form.appraiserSignature.startsWith('http') && (
                <img src={form.appraiserSignature} alt="Manager signature" className="max-h-20 max-w-full mx-auto" />
              )}
            </div>
            {/* Appraiser Name */}
            <p className="text-sm font-semibold text-gray-900">{form.appraiserName}</p>
            {/* Appraiser Label */}
            <p className="text-xs text-gray-600">Appraiser</p>
            {/* Date field */}
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={form.appraiserSignedDate}
              onChange={(e) => setForm((prev) => ({ ...prev, appraiserSignedDate: e.target.value }))}
              className="bg-transparent border-0 border-b border-gray-300 text-center text-sm placeholder:text-gray-400 focus:outline-none focus:border-b focus:border-gray-600"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Listing of Staff Performance Assessment</h3>
            <p className="text-sm text-gray-500 mt-1">Filename: [SURNAME]_[YEAR]_[MIDYEAR/YEAREND]</p>
          </div>
          <Badge variant="info">{listPreview.length} Saved</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Filename</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period Covered</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listPreview.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">No appraisal forms saved yet.</td>
                </tr>
              ) : (
                listPreview.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-800">{entry.filename}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.periodLabel}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.displayDate}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-1">
                        <Badge variant={statusVariantMap[entry.status]}>{statusLabelMap[entry.status]}</Badge>
                        {entry.status === 'returned' && entry.returnComment ? (
                          <p className="text-xs text-red-600">{entry.returnComment}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => loadEntry(entry)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => loadEntry(entry)}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          toast.promise(
                            downloadEntry(entry),
                            {
                              loading: 'Generating PDF...',
                              success: 'PDF downloaded successfully',
                              error: 'Failed to generate PDF'
                            }
                          )
                        }}>
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
