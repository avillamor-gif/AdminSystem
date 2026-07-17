'use client'

import { useRef, useState, useEffect } from 'react'
import { Award, Download, CheckCircle, Clock, Eye, X } from 'lucide-react'
import Image from 'next/image'
import { Card, Button, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useProgramEnrollments, useMarkCertificateIssued } from '@/hooks/useInternship'
import type { ProgramEnrollmentWithRelations } from '@/services/internship.service'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ─── Certificate Template ──────────────────────────────────────────────────────

interface CertTemplateProps {
  enrollment: ProgramEnrollmentWithRelations
  companyName?: string
}

// Helper to format date with ordinal (1st, 2nd, 3rd, etc.)
function getOrdinalDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate()
  const suffix = ['th', 'st', 'nd', 'rd'][((day % 10 > 3 || Math.floor((day % 100) / 10) === 1) ? 0 : day % 10)]
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${day}${suffix} day of ${months[date.getMonth()]} ${date.getFullYear()}`
}

function CertificateTemplate({ enrollment, companyName = 'II Admin' }: CertTemplateProps) {
  const fullName = enrollment.employee
    ? `${enrollment.employee.first_name} ${enrollment.employee.last_name}`
    : 'Participant'
  const programLabel: Record<string, string> = {
    internship:    'Internship Program',
    ojt:           'On-the-Job Training',
    volunteer:     'Volunteer Program',
    practicum:     'Practicum Program',
    apprenticeship:'Apprenticeship Program',
  }

  // State for e-signature URLs
  const [deptHeadSig, setDeptHeadSig] = useState<string | null>(null)
  const [deptHeadTitle, setDeptHeadTitle] = useState<string>('Department Head')
  const [coordinatorSig, setCoordinatorSig] = useState<string | null>(null)
  const [coordinatorName, setCoordinatorName] = useState<string>('_______________')
  const [edSig, setEdSig] = useState<string | null>(null)

  // Fetch e-signatures for all three signatories
  useEffect(() => {
    const fetchSignatures = async () => {
      const supabase = createClient()
      
      // Fetch Department Head signature and job title
      if (enrollment.departmentHead?.id) {
        try {
          // Get the employee's job title
          const { data: employee } = await supabase
            .from('employees')
            .select('job_title_id')
            .eq('id', enrollment.departmentHead.id)
            .maybeSingle()
          
          if (employee?.job_title_id) {
            const { data: jobTitle } = await supabase
              .from('job_titles')
              .select('title')
              .eq('id', employee.job_title_id)
              .maybeSingle()
            
            if (jobTitle?.title) {
              setDeptHeadTitle(jobTitle.title)
            }
          }
          
          const { data: attachments } = await supabase
            .from('employee_attachments')
            .select('file_path')
            .eq('employee_id', enrollment.departmentHead.id)
            .eq('document_type', 'e-signature')
            .maybeSingle()
          
          if (attachments?.file_path) {
            const { data } = await supabase.storage
              .from('attachments')
              .createSignedUrl(attachments.file_path, 3600)
            if (data?.signedUrl) setDeptHeadSig(data.signedUrl)
          }
        } catch (err) {
          console.error('Failed to fetch department head signature:', err)
        }
      }

      // Always fetch Jainno Bongon as Internship Program Coordinator
      try {
        const { data: employees } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('first_name', 'Jainno')
          .eq('last_name', 'Bongon')
          .maybeSingle()
        
        if (employees) {
          setCoordinatorName(`${employees.first_name} ${employees.last_name}`)
          
          // Fetch coordinator's signature
          const { data: attachments } = await supabase
            .from('employee_attachments')
            .select('file_path')
            .eq('employee_id', employees.id)
            .eq('document_type', 'e-signature')
            .maybeSingle()
          
          if (attachments?.file_path) {
            const { data } = await supabase.storage
              .from('attachments')
              .createSignedUrl(attachments.file_path, 3600)
            if (data?.signedUrl) setCoordinatorSig(data.signedUrl)
          }
        }
      } catch (err) {
        console.error('Failed to fetch coordinator:', err)
      }

      // Fetch Executive Director signature
      if (enrollment.executiveDirector?.id) {
        try {
          const { data: attachments } = await supabase
            .from('employee_attachments')
            .select('file_path')
            .eq('employee_id', enrollment.executiveDirector.id)
            .eq('document_type', 'e-signature')
            .maybeSingle()
          
          if (attachments?.file_path) {
            const { data } = await supabase.storage
              .from('attachments')
              .createSignedUrl(attachments.file_path, 3600)
            if (data?.signedUrl) setEdSig(data.signedUrl)
          }
        } catch (err) {
          console.error('Failed to fetch executive director signature:', err)
        }
      }
    }
    
    fetchSignatures()
  }, [enrollment.departmentHead?.id, enrollment.executiveDirector?.id])

  return (
    <div
      style={{
        width: 794,
        height: 562,
        fontFamily: 'Georgia, serif',
        background: 'linear-gradient(135deg, #fff8f0 0%, #fff 50%, #fff8f0 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
        boxSizing: 'border-box',
        userSelect: 'none',
        zIndex: 1,
      }}
    >
      {/* Award icon watermark */}
      <div style={{
        position: 'absolute', opacity: 0.05, zIndex: 0,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        width: 400,
        height: 400,
      }}>
        <img
          src="/ibon-icon.png"
          alt="watermark"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, marginTop: -20 }}>
        {/* IBON Logo */}
        <div style={{ marginBottom: 16, marginLeft: -40 }}>
          <img
            src="/ibon-logo.png"
            alt="IBON International"
            style={{ height: 60, margin: '0 auto', objectFit: 'contain' }}
          />
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, color: '#78350f', letterSpacing: 2, lineHeight: 1.1 }}>
          Certificate of Completion
        </div>
      </div>

      {/* Body */}
      <div style={{ textAlign: 'center', maxWidth: 650, marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, letterSpacing: 1 }}>
          THIS IS TO CERTIFY THAT
        </div>
        <div style={{
          fontSize: 36, fontWeight: 700, color: '#1c1917',
          fontStyle: 'italic', letterSpacing: 1, marginBottom: 8,
          borderBottom: '2px solid #d97706', paddingBottom: 6, display: 'inline-block',
        }}>
          {fullName}
        </div>
        
        {/* Single wrapper for all remaining text */}
        <div style={{ fontSize: 13, color: '#6b7280', margin: '12px 0', lineHeight: 1.6 }}>
          <div>has successfully completed the</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#78350f', margin: '4px 0' }}>
            {programLabel[enrollment.program_type] ?? enrollment.program_type}
          </div>
          {enrollment.partner_institution && (
            <div>in partnership with <strong>{enrollment.partner_institution.name}</strong></div>
          )}
          <div style={{ margin: '8px 0' }}>
            rendering a total of{' '}
            <strong style={{ color: '#78350f' }}>{Number(enrollment.rendered_hours).toFixed(0)} hours</strong>
            {enrollment.start_date && enrollment.end_date && (
              <> from{' '}<strong>{formatDate(enrollment.start_date)}</strong>{' '}to{' '}<strong>{formatDate(enrollment.end_date)}</strong></>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            Issued this {getOrdinalDate(new Date().toISOString().split('T')[0])} at IBON International Foundation Inc., Head Office, Quezon City, Philippines.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 36, width: '100%', padding: '0 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10 }}>
        {/* Signatories */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {/* Department Head */}
          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            {deptHeadSig && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={deptHeadSig} alt="Department Head signature" style={{ height: 48, objectFit: 'contain', display: 'block', marginLeft: 'auto', marginRight: 'auto', marginBottom: -8 }} />
            )}
            <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, lineHeight: 1.2, wordBreak: 'break-word', marginTop: 8 }}>
              {enrollment.departmentHead
                ? `${enrollment.departmentHead.first_name} ${enrollment.departmentHead.last_name}`
                : '_______________'}
            </div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>{deptHeadTitle}</div>
          </div>
          {/* Internship Program Coordinator */}
          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            {coordinatorSig && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coordinatorSig} alt="Coordinator signature" style={{ height: 48, objectFit: 'contain', display: 'block', marginLeft: 'auto', marginRight: 'auto', marginBottom: -8 }} />
            )}
            <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, lineHeight: 1.2, wordBreak: 'break-word', marginTop: 8 }}>
              {coordinatorName}
            </div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>Internship Program Coordinator</div>
          </div>
          {/* Executive Director */}
          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            {edSig && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={edSig} alt="Executive Director signature" style={{ height: 48, objectFit: 'contain', display: 'block', marginLeft: 'auto', marginRight: 'auto', marginBottom: -8 }} />
            )}
            <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, lineHeight: 1.2, wordBreak: 'break-word', marginTop: 8 }}>
              {enrollment.executiveDirector
                ? `${enrollment.executiveDirector.first_name} ${enrollment.executiveDirector.last_name}`
                : '_______________'}
            </div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>Executive Director</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const { data: enrollments = [], isLoading } = useProgramEnrollments()
  const markIssuedMutation = useMarkCertificateIssued()

  const [previewEnrollment, setPreviewEnrollment] = useState<ProgramEnrollmentWithRelations | null>(null)
  const [previewModal, setPreviewModal]           = useState<ProgramEnrollmentWithRelations | null>(null)
  const [confirmIssue, setConfirmIssue]           = useState<ProgramEnrollmentWithRelations | null>(null)
  const [statusFilter, setStatusFilter]           = useState<'all' | 'issued' | 'pending'>('all')
  const certRef = useRef<HTMLDivElement>(null)

  const eligible = enrollments.filter(e =>
    e.status === 'completed' ||
    (e.status === 'active' && (Number(e.rendered_hours) >= e.required_hours))
  )

  const filtered = eligible.filter(e => {
    if (statusFilter === 'issued')  return e.certificate_issued
    if (statusFilter === 'pending') return !e.certificate_issued
    return true
  })

  async function handleDownload(enr: ProgramEnrollmentWithRelations) {
    setPreviewEnrollment(enr)
    // Give React time to render the template before capturing
    await new Promise(resolve => setTimeout(resolve, 300))

    // Wait for ALL images (including signatures) to load
    if (certRef.current) {
      const images = certRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img: HTMLImageElement) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve()
              } else {
                img.onload = () => resolve()
                img.onerror = () => resolve() // Resolve even on error
              }
            })
        )
      )
    }

    // Now convert all images to base64 data URLs for reliable PDF capture
    if (certRef.current) {
      const images = certRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(async (img: HTMLImageElement) => {
          if (img.src && img.src.startsWith('http')) {
            try {
              const response = await fetch(img.src)
              const blob = await response.blob()
              const dataUrl = await new Promise<string>(resolve => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
              })
              img.src = dataUrl
            } catch (err) {
              console.warn('Failed to convert image to base64:', img.src, err)
            }
          }
        })
      )
    }
    
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF }   = await import('jspdf')
    if (!certRef.current) return
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff8f0' })
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = pdf.internal.pageSize.getHeight()
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h)
    const name = enr.employee ? `${enr.employee.first_name}_${enr.employee.last_name}` : 'certificate'
    pdf.save(`Certificate_${name}.pdf`)
  }

  const stats = {
    eligible: eligible.length,
    issued:   eligible.filter(e => e.certificate_issued).length,
    pending:  eligible.filter(e => !e.certificate_issued).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-600 mt-1">Generate and issue completion certificates for participants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Certificate-Eligible', value: stats.eligible, icon: Award,        color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Issued',               value: stats.issued,   icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Pending Issuance',     value: stats.pending,  icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'issued'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No eligible participants found. Participants become eligible once they complete their program or reach required hours.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(enr => {
            const name = enr.employee
              ? `${enr.employee.first_name} ${enr.employee.last_name}`
              : 'Unknown'
            const pct = enr.required_hours > 0
              ? Math.min(100, Math.round((Number(enr.rendered_hours) / enr.required_hours) * 100))
              : 100

            return (
              <Card key={enr.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500 capitalize">{enr.program_type} · {enr.partner_institution?.name ?? 'Walk-in'}</p>
                  </div>
                  {enr.certificate_issued ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" /> Issued
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>

                {/* Hours progress mini */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{Number(enr.rendered_hours).toFixed(0)}h rendered</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-orange-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {enr.certificate_issued_at && (
                  <p className="text-xs text-gray-400">Issued: {formatDate(enr.certificate_issued_at.split('T')[0])}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => setPreviewModal(enr)}
                    className="flex-1 text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(enr)}
                    className="flex-1 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download PDF
                  </Button>
                  {!enr.certificate_issued && (
                    <Button
                      onClick={() => setConfirmIssue(enr)}
                      className="flex-1 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark Issued
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Off-screen certificate template for rendering */}
      {previewEnrollment && (
        <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1 }}>
          <div ref={certRef}>
            <CertificateTemplate enrollment={previewEnrollment} />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={!!previewModal} onClose={() => setPreviewModal(null)} centered size="xl">
        <ModalHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Certificate Preview</h2>
            <button onClick={() => setPreviewModal(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </ModalHeader>
        <ModalBody className="max-h-[85vh] overflow-auto flex justify-center items-center p-8">
          {previewModal && (
            <div>
              <CertificateTemplate enrollment={previewModal} />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setPreviewModal(null)}>
            Close
          </Button>
          <Button
            onClick={() => {
              if (previewModal) {
                handleDownload(previewModal)
                setPreviewModal(null)
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirm mark issued */}
      <ConfirmModal
        isOpen={!!confirmIssue}
        onClose={() => setConfirmIssue(null)}
        onConfirm={async () => {
          if (confirmIssue) {
            await markIssuedMutation.mutateAsync({ id: confirmIssue.id })
            setConfirmIssue(null)
          }
        }}
        title="Mark Certificate as Issued"
        message={`Confirm that a certificate has been issued to ${confirmIssue?.employee ? `${confirmIssue.employee.first_name} ${confirmIssue.employee.last_name}` : 'this participant'}?`}
        confirmText="Confirm"
        variant="info"
      />
    </div>
  )
}
