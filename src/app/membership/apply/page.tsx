'use client'

import { useState } from 'react'
import { Plus, X, AlertCircle, CheckCircle2, Globe, Mail } from 'lucide-react'
import { Button, Card, Input, Modal, ModalBody, ModalHeader, Badge } from '@/components/ui'
import { useCreateMemberApplication, useCreateMemberEducation, useCreateMemberOrgAffiliation, useCreateMemberEngagementHistory } from '@/hooks/useMemberApplication'
import type { MemberApplication, MemberEducation, MemberOrgAffiliation, MemberEngagementHistory } from '@/services/memberApplication.service'

const inp = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400'
const label_cls = 'block text-sm font-medium text-gray-700 mb-1'

export default function MembershipApplicationPage() {
  const [step, setStep] = useState<'personal' | 'education' | 'organization' | 'engagement' | 'endorsement' | 'review'>(
    'personal'
  )
  const [submitted, setSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)

  // Main form
  const [form, setForm] = useState<Partial<MemberApplication>>({
    first_name: '',
    last_name: '',
    email: '',
    age: undefined,
    citizenship: '',
    sex: '',
    home_address: '',
    office_address: '',
    phone_home: '',
    phone_office: '',
    how_learned_about_ibon: '',
    why_join: '',
    publications_read: '',
    endorser_name: '',
    endorser_relationship: '',
    endorser_email: '',
  })

  // Sub-records
  const [education, setEducation] = useState<Partial<MemberEducation>[]>([])
  const [affiliations, setAffiliations] = useState<Partial<MemberOrgAffiliation>[]>([])
  const [engagements, setEngagements] = useState<Partial<MemberEngagementHistory>[]>([])

  // Modal states
  const [educationModal, setEducationModal] = useState(false)
  const [affiliationModal, setAffiliationModal] = useState(false)
  const [engagementModal, setEngagementModal] = useState(false)
  const [currentEducation, setCurrentEducation] = useState<Partial<MemberEducation> | null>(null)
  const [currentAffiliation, setCurrentAffiliation] = useState<Partial<MemberOrgAffiliation> | null>(null)
  const [currentEngagement, setCurrentEngagement] = useState<Partial<MemberEngagementHistory> | null>(null)

  // Mutations
  const createApp = useCreateMemberApplication()

  // Validation
  function canContinue(): boolean {
    switch (step) {
      case 'personal':
        return !!(form.first_name && form.last_name && form.email && form.citizenship)
      case 'education':
      case 'organization':
      case 'engagement':
      case 'endorsement':
        return true
      case 'review':
        return !!(form.first_name && form.last_name && form.email && form.endorser_name && form.endorser_email)
      default:
        return false
    }
  }

  async function submitApplication() {
    if (!canContinue()) {
      alert('Please fill all required fields')
      return
    }

    try {
      // Create main application — toast.success is shown by the hook's onSuccess
      const app = await createApp.mutateAsync(form as any)
      setReferenceNumber((app as any)?.reference_number ?? null)
      setSubmitted(true)
    } catch (error: any) {
      console.error('Submission error:', error)
      if (!error?.message?.includes('toast')) {
        alert(error?.message || 'Failed to submit application. Please try again.')
      }
    }
  }

  // Step 1: Personal Information
  const PersonalStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label_cls}>First Name <span className="text-red-500">*</span></label>
          <input
            required
            value={form.first_name || ''}
            onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
            className={inp}
            placeholder="Juan"
          />
        </div>
        <div>
          <label className={label_cls}>Last Name <span className="text-red-500">*</span></label>
          <input
            required
            value={form.last_name || ''}
            onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
            className={inp}
            placeholder="dela Cruz"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={label_cls}>Age</label>
          <input
            type="number"
            value={form.age || ''}
            onChange={(e) => setForm((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : undefined }))}
            className={inp}
            placeholder="35"
          />
        </div>
        <div>
          <label className={label_cls}>Citizenship <span className="text-red-500">*</span></label>
          <input
            required
            value={form.citizenship || ''}
            onChange={(e) => setForm((p) => ({ ...p, citizenship: e.target.value }))}
            className={inp}
            placeholder="Filipino"
          />
        </div>
        <div>
          <label className={label_cls}>Gender/Sex</label>
          <select
            value={form.sex || ''}
            onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
            className={inp}
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label_cls}>Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          required
          value={form.email || ''}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className={inp}
          placeholder="juan@example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label_cls}>Phone (Home)</label>
          <input
            value={form.phone_home || ''}
            onChange={(e) => setForm((p) => ({ ...p, phone_home: e.target.value }))}
            className={inp}
            placeholder="+63 2 123 4567"
          />
        </div>
        <div>
          <label className={label_cls}>Phone (Office)</label>
          <input
            value={form.phone_office || ''}
            onChange={(e) => setForm((p) => ({ ...p, phone_office: e.target.value }))}
            className={inp}
            placeholder="+63 2 765 4321"
          />
        </div>
      </div>

      <div>
        <label className={label_cls}>Home Address</label>
        <textarea
          value={form.home_address || ''}
          onChange={(e) => setForm((p) => ({ ...p, home_address: e.target.value }))}
          className={inp}
          rows={2}
          placeholder="123 Main St, Barangay, Quezon City, Metro Manila"
        />
      </div>

      <div>
        <label className={label_cls}>Office Address</label>
        <textarea
          value={form.office_address || ''}
          onChange={(e) => setForm((p) => ({ ...p, office_address: e.target.value }))}
          className={inp}
          rows={2}
          placeholder="456 Business Ave, Makati City"
        />
      </div>
    </div>
  )

  // Step 2: Education
  const EducationStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Educational Background</h3>
        <Button
          variant="secondary"
          onClick={() => {
            setCurrentEducation({})
            setEducationModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>

      {education.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No education records added yet</p>
      ) : (
        <div className="space-y-2">
          {education.map((edu, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{edu.institution_name}</p>
                <p className="text-sm text-gray-600">
                  {edu.highest_attainment} • {edu.years_inclusive}
                </p>
              </div>
              <button
                onClick={() => {
                  setEducation((p) => p.filter((_, i) => i !== idx))
                }}
                className="p-1 hover:bg-red-50 rounded text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Step 3: Organization
  const OrganizationStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Current Organizational Affiliation</h3>
        <Button
          variant="secondary"
          onClick={() => {
            setCurrentAffiliation({})
            setAffiliationModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Organization
        </Button>
      </div>

      {affiliations.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No organization records added yet</p>
      ) : (
        <div className="space-y-2">
          {affiliations.map((aff, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{aff.organization_name}</p>
                <p className="text-sm text-gray-600">
                  {aff.position} • {aff.organization_type} • {aff.years_involved} years
                </p>
              </div>
              <button
                onClick={() => {
                  setAffiliations((p) => p.filter((_, i) => i !== idx))
                }}
                className="p-1 hover:bg-red-50 rounded text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Step 4: IBON Engagement
  const EngagementStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Engagement with IBON International</h3>

      <div>
        <label className={label_cls}>How did you learn about IBON International?</label>
        <textarea
          value={form.how_learned_about_ibon || ''}
          onChange={(e) => setForm((p) => ({ ...p, how_learned_about_ibon: e.target.value }))}
          className={inp}
          rows={3}
          placeholder="e.g., Through a friend, colleague recommendation, website, event, social media, etc."
        />
      </div>

      <div>
        <label className={label_cls}>Why do you want to be an IBON International member?</label>
        <textarea
          value={form.why_join || ''}
          onChange={(e) => setForm((p) => ({ ...p, why_join: e.target.value }))}
          className={inp}
          rows={4}
          placeholder="Share your motivation and interest in joining..."
        />
      </div>

      <div>
        <label className={label_cls}>IBON International publications you've read</label>
        <textarea
          value={form.publications_read || ''}
          onChange={(e) => setForm((p) => ({ ...p, publications_read: e.target.value }))}
          className={inp}
          rows={2}
          placeholder="e.g., IBON policy papers, magazines, reports you've read..."
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <h4 className="font-medium text-gray-900">Participation History (Optional)</h4>
        <Button
          variant="secondary"
          onClick={() => {
            setCurrentEngagement({})
            setEngagementModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
      </div>

      {engagements.length === 0 ? (
        <p className="text-sm text-gray-500">No IBON engagement records yet</p>
      ) : (
        <div className="space-y-2">
          {engagements.map((eng, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{eng.title}</p>
                <p className="text-sm text-gray-600">
                  {eng.participation_type} • {eng.date_participated} • {eng.location}
                </p>
              </div>
              <button
                onClick={() => {
                  setEngagements((p) => p.filter((_, i) => i !== idx))
                }}
                className="p-1 hover:bg-red-50 rounded text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Step 5: Endorsement
  const EndorsementStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Endorsement</h3>
      <p className="text-sm text-gray-600">
        Please provide information of someone from IBON International or a trusted partner who can verify your application.
      </p>

      <div>
        <label className={label_cls}>Endorser Name <span className="text-red-500">*</span></label>
        <input
          required
          value={form.endorser_name || ''}
          onChange={(e) => setForm((p) => ({ ...p, endorser_name: e.target.value }))}
          className={inp}
          placeholder="Maria Santos"
        />
      </div>

      <div>
        <label className={label_cls}>Relationship to Endorser <span className="text-red-500">*</span></label>
        <select
          required
          value={form.endorser_relationship || ''}
          onChange={(e) => setForm((p) => ({ ...p, endorser_relationship: e.target.value }))}
          className={inp}
        >
          <option value="">-- Select --</option>
          <option value="Colleague">Colleague</option>
          <option value="IBON Staff">IBON Staff</option>
          <option value="Partner Organization">Partner Organization</option>
          <option value="Friend">Friend</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className={label_cls}>Endorser Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          required
          value={form.endorser_email || ''}
          onChange={(e) => setForm((p) => ({ ...p, endorser_email: e.target.value }))}
          className={inp}
          placeholder="maria@ibonintl.org"
        />
      </div>
    </div>
  )

  // Step 6: Review & Submit
  const ReviewStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Review Your Application</h3>

      <Card>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">
              {form.first_name} {form.last_name}
            </span>
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{form.email}</span>
            <span className="text-gray-600">Citizenship:</span>
            <span className="font-medium">{form.citizenship}</span>
            <span className="text-gray-600">Age:</span>
            <span className="font-medium">{form.age || '—'}</span>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Education Records:</strong> {education.length}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Organization Affiliations:</strong> {affiliations.length}
            </p>
            <p className="text-sm text-gray-600">
              <strong>IBON Engagement History:</strong> {engagements.length}
            </p>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Before you submit:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Make sure all information is accurate</li>
            <li>Your endorser will receive a verification request</li>
            <li>We'll send you a confirmation email</li>
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-900">
          By submitting this form, I certify that the information provided is true and correct.
        </p>
      </div>
    </div>
  )

  // ── Thank-you screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex items-center justify-center py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-10 h-10 text-amber-500" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You for Applying!</h1>
          <p className="text-lg text-amber-700 font-medium mb-6">
            Welcome to the IBON International community.
          </p>

          {/* Message */}
          <p className="text-gray-600 leading-relaxed mb-4">
            Your application has been received. We believe that every voice matters in the
            pursuit of a just, equitable, and sustainable world — and we are glad you want
            to be part of that mission.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Our team will review your application and reach out to you soon. In the meantime,
            feel free to explore our work and stay connected with the movement.
          </p>

          {/* Reference number */}
          {referenceNumber && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-8">
              <Mail className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Your reference number: <strong>{referenceNumber}</strong>
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://iboninternational.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4" />
              Visit IBON International's Website
            </a>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-400 mt-10">
            Our team will review your application and notify you at <strong>{form.email}</strong> once a decision has been made.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IBON International</h1>
          <p className="text-lg text-gray-700">Membership Application</p>
          <p className="text-sm text-gray-500 mt-2">
            Join our global network of progressive organizations and practitioners
          </p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => { setSubmitted(true); setReferenceNumber('APP-PREVIEW-001') }}
              className="mt-3 text-xs text-amber-500 underline hover:text-amber-700"
            >
              [Dev] Preview thank-you page
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {['personal', 'education', 'organization', 'engagement', 'endorsement', 'review'].map((s, idx) => (
              <div key={s} className="flex items-center flex-1">
                <button
                  onClick={() => setStep(s as any)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    s === step
                      ? 'bg-amber-500 text-white'
                      : ['personal', 'education', 'organization', 'engagement', 'endorsement', 'review'].indexOf(s) <
                          ['personal', 'education', 'organization', 'engagement', 'endorsement', 'review'].indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
                {idx < 5 && (
                  <div
                    className={`h-1 flex-1 mx-1 ${
                      ['personal', 'education', 'organization', 'engagement', 'endorsement', 'review'].indexOf(s) <
                      ['personal', 'education', 'organization', 'engagement', 'endorsement', 'review'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Personal</span>
            <span>Education</span>
            <span>Organization</span>
            <span>Engagement</span>
            <span>Endorsement</span>
            <span>Review</span>
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-6">
          <div className="p-6">
            {step === 'personal' && PersonalStep()}
            {step === 'education' && EducationStep()}
            {step === 'organization' && OrganizationStep()}
            {step === 'engagement' && EngagementStep()}
            {step === 'endorsement' && EndorsementStep()}
            {step === 'review' && ReviewStep()}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              const steps = ['personal', 'education', 'organization', 'engagement', 'endorsement', 'review']
              const currentIdx = steps.indexOf(step)
              if (currentIdx > 0) setStep(steps[currentIdx - 1] as any)
            }}
            disabled={step === 'personal'}
          >
            ← Back
          </Button>

          {step === 'review' ? (
            <Button
              variant="primary"
              onClick={submitApplication}
              disabled={createApp.isPending || !canContinue()}
            >
              {createApp.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                const steps = ['personal', 'education', 'organization', 'engagement', 'endorsement', 'review']
                const currentIdx = steps.indexOf(step)
                if (currentIdx < steps.length - 1 && canContinue()) setStep(steps[currentIdx + 1] as any)
              }}
              disabled={!canContinue()}
            >
              Continue →
            </Button>
          )}
        </div>
      </div>

      {/* Education Modal */}
      <Modal open={educationModal} onClose={() => setEducationModal(false)}>
        <ModalHeader onClose={() => setEducationModal(false)}>Add Education</ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div>
              <label className={label_cls}>Highest Educational Attainment</label>
              <input
                value={currentEducation?.highest_attainment || ''}
                onChange={(e) => setCurrentEducation((p) => ({ ...p, highest_attainment: e.target.value }))}
                className={inp}
                placeholder="e.g., Bachelor's Degree, Master's Degree"
              />
            </div>
            <div>
              <label className={label_cls}>Institution Name</label>
              <input
                value={currentEducation?.institution_name || ''}
                onChange={(e) => setCurrentEducation((p) => ({ ...p, institution_name: e.target.value }))}
                className={inp}
                placeholder="e.g., University of the Philippines"
              />
            </div>
            <div>
              <label className={label_cls}>Institution Address</label>
              <input
                value={currentEducation?.institution_address || ''}
                onChange={(e) => setCurrentEducation((p) => ({ ...p, institution_address: e.target.value }))}
                className={inp}
              />
            </div>
            <div>
              <label className={label_cls}>Years (e.g., 2010-2014)</label>
              <input
                value={currentEducation?.years_inclusive || ''}
                onChange={(e) => setCurrentEducation((p) => ({ ...p, years_inclusive: e.target.value }))}
                className={inp}
              />
            </div>
          </div>
        </ModalBody>
        <div className="p-4 border-t flex gap-2">
          <Button variant="secondary" onClick={() => setEducationModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (currentEducation?.institution_name) {
                setEducation((p) => [...p, currentEducation])
                setEducationModal(false)
                setCurrentEducation(null)
              }
            }}
          >
            Add
          </Button>
        </div>
      </Modal>

      {/* Affiliation Modal */}
      <Modal open={affiliationModal} onClose={() => setAffiliationModal(false)}>
        <ModalHeader onClose={() => setAffiliationModal(false)}>Add Organization</ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div>
              <label className={label_cls}>Organization Name</label>
              <input
                required
                value={currentAffiliation?.organization_name || ''}
                onChange={(e) => setCurrentAffiliation((p) => ({ ...p, organization_name: e.target.value }))}
                className={inp}
              />
            </div>
            <div>
              <label className={label_cls}>Position/Role</label>
              <input
                value={currentAffiliation?.position || ''}
                onChange={(e) => setCurrentAffiliation((p) => ({ ...p, position: e.target.value }))}
                className={inp}
                placeholder="e.g., Executive Director, Board Member"
              />
            </div>
            <div>
              <label className={label_cls}>Years Involved</label>
              <input
                type="number"
                value={currentAffiliation?.years_involved || ''}
                onChange={(e) =>
                  setCurrentAffiliation((p) => ({ ...p, years_involved: e.target.value ? Number(e.target.value) : undefined }))
                }
                className={inp}
              />
            </div>
            <div>
              <label className={label_cls}>Organization Address</label>
              <input value={currentAffiliation?.organization_address || ''} onChange={(e) => setCurrentAffiliation((p) => ({ ...p, organization_address: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={label_cls}>Organization Type</label>
              <select
                value={currentAffiliation?.organization_type || ''}
                onChange={(e) => setCurrentAffiliation((p) => ({ ...p, organization_type: e.target.value }))}
                className={inp}
              >
                <option value="">-- Select --</option>
                <option value="People's Organization">People's Organization</option>
                <option value="Non-Government Organization">Non-Government Organization</option>
                <option value="Network">Network</option>
                <option value="Platform">Platform</option>
                <option value="Coalition">Coalition</option>
                <option value="Think Tank">Think Tank</option>
                <option value="Academic Institution">Academic Institution</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </ModalBody>
        <div className="p-4 border-t flex gap-2">
          <Button variant="secondary" onClick={() => setAffiliationModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (currentAffiliation?.organization_name) {
                setAffiliations((p) => [...p, currentAffiliation])
                setAffiliationModal(false)
                setCurrentAffiliation(null)
              }
            }}
          >
            Add
          </Button>
        </div>
      </Modal>

      {/* Engagement Modal */}
      <Modal open={engagementModal} onClose={() => setEngagementModal(false)}>
        <ModalHeader onClose={() => setEngagementModal(false)}>Add IBON Engagement</ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div>
              <label className={label_cls}>Event Title</label>
              <input
                value={currentEngagement?.title || ''}
                onChange={(e) => setCurrentEngagement((p) => ({ ...p, title: e.target.value }))}
                className={inp}
                placeholder="e.g., Global Assembly 2024"
              />
            </div>
            <div>
              <label className={label_cls}>Event Type</label>
              <select
                value={currentEngagement?.engagement_type || ''}
                onChange={(e) => setCurrentEngagement((p) => ({ ...p, engagement_type: e.target.value }))}
                className={inp}
              >
                <option value="">-- Select --</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Training">Training</option>
                <option value="Webinar">Webinar</option>
                <option value="Campaign">Campaign</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={label_cls}>Date Participated</label>
              <input
                value={currentEngagement?.date_participated || ''}
                onChange={(e) => setCurrentEngagement((p) => ({ ...p, date_participated: e.target.value }))}
                className={inp}
                placeholder="e.g., May 15-18, 2024"
              />
            </div>
            <div>
              <label className={label_cls}>Location</label>
              <input
                value={currentEngagement?.location || ''}
                onChange={(e) => setCurrentEngagement((p) => ({ ...p, location: e.target.value }))}
                className={inp}
                placeholder="e.g., Bangkok, Thailand"
              />
            </div>
            <div>
              <label className={label_cls}>Type of Participation</label>
              <select
                value={currentEngagement?.participation_type || ''}
                onChange={(e) => setCurrentEngagement((p) => ({ ...p, participation_type: e.target.value }))}
                className={inp}
              >
                <option value="">-- Select --</option>
                <option value="Participant">Participant</option>
                <option value="Speaker">Speaker</option>
                <option value="Facilitator">Facilitator</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
          </div>
        </ModalBody>
        <div className="p-4 border-t flex gap-2">
          <Button variant="secondary" onClick={() => setEngagementModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (currentEngagement?.title) {
                setEngagements((p) => [...p, currentEngagement])
                setEngagementModal(false)
                setCurrentEngagement(null)
              }
            }}
          >
            Add
          </Button>
        </div>
      </Modal>
    </div>
  )
}
