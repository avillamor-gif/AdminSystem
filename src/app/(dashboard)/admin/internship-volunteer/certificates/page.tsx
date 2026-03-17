'use client'

import { useRef, useState } from 'react'
import { Award, Download, CheckCircle, Clock } from 'lucide-react'
import { Card, Button, ConfirmModal } from '@/components/ui'
import { useProgramEnrollments, useMarkCertificateIssued } from '@/hooks/useInternship'
import type { ProgramEnrollmentWithRelations } from '@/services/internship.service'
import { formatDate } from '@/lib/utils'

// ─── Certificate Template ──────────────────────────────────────────────────────

interface CertTemplateProps {
  enrollment: ProgramEnrollmentWithRelations
  companyName?: string
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

  return (
    <div
      style={{
        width: 794,
        height: 562,
        fontFamily: 'Georgia, serif',
        background: 'linear-gradient(135deg, #fff8f0 0%, #fff 50%, #fff8f0 100%)',
        border: '8px solid #b45309',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Decorative corners */}
      {[
        { top: 12, left: 12 },
        { top: 12, right: 12 },
        { bottom: 12, left: 12 },
        { bottom: 12, right: 12 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 40, height: 40,
          border: '3px solid #d97706',
          borderRadius: 2,
        }} />
      ))}

      {/* Award icon watermark */}
      <div style={{
        position: 'absolute', opacity: 0.05,
        fontSize: 280, color: '#b45309',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        lineHeight: 1,
      }}>
        ★
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>
          {companyName}
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, color: '#78350f', letterSpacing: 2, lineHeight: 1.1 }}>
          Certificate of Completion
        </div>
        <div style={{ width: 80, height: 3, background: '#d97706', margin: '10px auto' }} />
      </div>

      {/* Body */}
      <div style={{ textAlign: 'center', maxWidth: 580 }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, letterSpacing: 1 }}>
          THIS IS TO CERTIFY THAT
        </div>
        <div style={{
          fontSize: 36, fontWeight: 700, color: '#1c1917',
          fontStyle: 'italic', letterSpacing: 1, marginBottom: 8,
          borderBottom: '2px solid #d97706', paddingBottom: 6, display: 'inline-block',
        }}>
          {fullName}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', margin: '12px 0 4px', letterSpacing: 0.5 }}>
          has successfully completed the
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#78350f', marginBottom: 4 }}>
          {programLabel[enrollment.program_type] ?? enrollment.program_type}
        </div>
        {enrollment.partner_institution && (
          <div style={{ fontSize: 13, color: '#4b5563' }}>
            in partnership with <strong>{enrollment.partner_institution.name}</strong>
          </div>
        )}
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
          rendering a total of{' '}
          <strong style={{ color: '#78350f' }}>{Number(enrollment.rendered_hours).toFixed(0)} hours</strong>
          {enrollment.start_date && enrollment.end_date && (
            <> from{' '}<strong>{formatDate(enrollment.start_date)}</strong>{' '}to{' '}<strong>{formatDate(enrollment.end_date)}</strong></>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 36, width: '100%', display: 'flex', justifyContent: 'space-around', padding: '0 80px', boxSizing: 'border-box' }}>
        {/* Date */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 140, borderTop: '2px solid #a16207', paddingTop: 4 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Date Issued</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(new Date().toISOString().split('T')[0])}</div>
          </div>
        </div>
        {/* Signatory */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 140, borderTop: '2px solid #a16207', paddingTop: 4 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Authorized By</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>HR Manager</div>
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
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF }   = await import('jspdf')
    if (!certRef.current) return
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff8f0' })
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
