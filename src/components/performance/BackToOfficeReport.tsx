'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Input, Select } from '@/components/ui'
import { Download, Save } from 'lucide-react'
import jsPDF from 'jspdf'

interface Activity {
  id: string
  title: string
  type: string
  organiser: string
  engagement: string
  thematicWork: string[]
  intersection: string[]
  roles: string[]
  highlights: string
}

interface Contact {
  id: string
  name: string
  organisation: string
  email: string
  influence: string
  outreachType: string
}

interface KeyActor {
  actor: string
  response: string
  notes: string
}

interface BTORFormState {
  staffName: string
  unit: string
  fromDate: string
  untilDate: string
  location: string
  funder: string
  fundingSupport: string
  activities: Activity[]
  mainPositions: string
  policyTrends: string
  keyActors: string
  allianceQuestion: string
  actorResponses: KeyActor[]
  challenges: string
  newContacts: Contact[]
  recommendations: string
}

const DRAFT_STORAGE_KEY = 'btor-draft-v1'

export default function BackToOfficeReport({
  initialStaffName = '',
  initialUnit = '',
}: {
  initialStaffName?: string
  initialUnit?: string
}) {
  const [form, setForm] = useState<BTORFormState>({
    staffName: initialStaffName,
    unit: initialUnit,
    fromDate: '',
    untilDate: '',
    location: '',
    funder: '',
    fundingSupport: 'Fully Supported',
    activities: [{ id: '1', title: '', type: '', organiser: '', engagement: '', thematicWork: [], intersection: [], roles: [], highlights: '' }],
    mainPositions: '',
    policyTrends: '',
    keyActors: '',
    allianceQuestion: '',
    actorResponses: [
      { actor: 'State Actors', response: 'Not Applicable', notes: '' },
      { actor: 'CSOs', response: 'Not Applicable', notes: '' },
      { actor: 'POs and Social Movements', response: '', notes: '' },
      { actor: 'Multilateral Institutions', response: 'Not Applicable', notes: '' },
      { actor: 'Private Sector', response: 'Not Applicable', notes: '' },
      { actor: 'Media', response: 'Not Applicable', notes: '' },
      { actor: 'Donors', response: 'Not Applicable', notes: '' },
    ],
    challenges: '',
    newContacts: [],
    recommendations: '',
  })

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (saved) {
      try {
        setForm(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
    }, 1000)
    return () => clearTimeout(timer)
  }, [form])

  const updateForm = (updates: Partial<BTORFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const addActivity = () => {
    const newId = String(form.activities.length + 1)
    setForm((prev) => ({
      ...prev,
      activities: [...prev.activities, { id: newId, title: '', type: '', organiser: '', engagement: '', thematicWork: [], intersection: [], roles: [], highlights: '' }],
    }))
  }

  const removeActivity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== id),
    }))
  }

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }))
  }

  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      newContacts: [...prev.newContacts, { id: String(prev.newContacts.length + 1), name: '', organisation: '', email: '', influence: '', outreachType: '' }],
    }))
  }

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setForm((prev) => ({
      ...prev,
      newContacts: prev.newContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }

  const removeContact = (id: string) => {
    setForm((prev) => ({
      ...prev,
      newContacts: prev.newContacts.filter((c) => c.id !== id),
    }))
  }

  const exportPDF = () => {
    const pdf = new jsPDF()
    let yPos = 10

    const addLine = (text: string, size = 11, bold = false) => {
      if (yPos > 280) {
        pdf.addPage()
        yPos = 10
      }
      pdf.setFontSize(size)
      pdf.setFont(undefined, bold ? 'bold' : 'normal')
      pdf.text(text, 10, yPos)
      yPos += size / 2.5
    }

    addLine('BACK TO THE OFFICE REPORT', 14, true)
    addLine('')

    // Travel Information
    addLine('Travel Information', 12, true)
    addLine(`Staff Name: ${form.staffName}`)
    addLine(`Unit: ${form.unit}`)
    addLine(`Dates: From ${form.fromDate} to ${form.untilDate}`)
    addLine(`Location: ${form.location}`)
    addLine(`Funder: ${form.funder}`)
    addLine(`Funding Support: ${form.fundingSupport}`)
    addLine('')

    // Activities
    addLine('Activities', 12, true)
    form.activities.forEach((activity, index) => {
      addLine(`Activity ${index + 1}: ${activity.title}`)
      addLine(`Type: ${activity.type}`)
      addLine(`Organiser: ${activity.organiser}`)
      addLine(`Highlights: ${activity.highlights}`)
      addLine('')
    })

    // Reflections
    addLine('Reflections', 12, true)
    addLine(`Main Positions: ${form.mainPositions}`)
    addLine(`Policy Trends: ${form.policyTrends}`)
    addLine(`Key Actors: ${form.keyActors}`)
    addLine('')

    // Challenges
    addLine('Challenges & Lessons', 12, true)
    addLine(form.challenges)
    addLine('')

    // Recommendations
    addLine('Recommendations', 12, true)
    addLine(form.recommendations)

    pdf.save(`BTOR_${form.staffName}_${new Date().toLocaleDateString()}.pdf`)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Back to the Office Report</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))}>
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={exportPDF}>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Travel Information Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Travel Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
            <Input value={form.staffName} onChange={(e) => updateForm({ staffName: e.target.value })} placeholder="Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <Input value={form.unit} onChange={(e) => updateForm({ unit: e.target.value })} placeholder="Unit" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input type="date" value={form.fromDate} onChange={(e) => updateForm({ fromDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Until Date</label>
            <Input type="date" value={form.untilDate} onChange={(e) => updateForm({ untilDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <Input value={form.location} onChange={(e) => updateForm({ location: e.target.value })} placeholder="City, Country" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funder</label>
            <Input value={form.funder} onChange={(e) => updateForm({ funder: e.target.value })} placeholder="Funder" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funding Support</label>
            <Select
              value={form.fundingSupport}
              onChange={(e) => updateForm({ fundingSupport: e.target.value })}
              options={['Fully Supported', 'Partially Supported', 'Self-funded']}
            />
          </div>
        </div>
      </Card>

      {/* Activities Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
          <Button variant="secondary" onClick={addActivity}>
            + Add Activity
          </Button>
        </div>

        {form.activities.map((activity) => (
          <div key={activity.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
                <Input value={activity.title} onChange={(e) => updateActivity(activity.id, { title: e.target.value })} placeholder="Title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Select
                  value={activity.type}
                  onChange={(e) => updateActivity(activity.id, { type: e.target.value })}
                  options={['Forum/Conference', 'Training', 'Meeting', 'Workshop', 'Other']}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organiser</label>
                <Input value={activity.organiser} onChange={(e) => updateActivity(activity.id, { organiser: e.target.value })} placeholder="Organiser" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level of Engagement</label>
                <Select
                  value={activity.engagement}
                  onChange={(e) => updateActivity(activity.id, { engagement: e.target.value })}
                  options={['Representative', 'Participant', 'Observer', 'Observer']}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
              <textarea
                value={activity.highlights}
                onChange={(e) => updateActivity(activity.id, { highlights: e.target.value })}
                placeholder="Include key highlights from the activity"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
                rows={3}
              />
            </div>
            {form.activities.length > 1 && (
              <Button variant="danger" onClick={() => removeActivity(activity.id)}>
                Remove Activity
              </Button>
            )}
          </div>
        ))}
      </Card>

      {/* Reflections Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Reflections</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main positions forwarded?</label>
            <textarea
              value={form.mainPositions}
              onChange={(e) => updateForm({ mainPositions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emerging policy trends?</label>
            <textarea
              value={form.policyTrends}
              onChange={(e) => updateForm({ policyTrends: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key actors and their responses?</label>
            <textarea
              value={form.keyActors}
              onChange={(e) => updateForm({ keyActors: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Key Actors Response Table */}
      <Card className="p-6 space-y-4 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900">Key Actors Response</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">Actor</th>
              <th className="text-left py-2 font-semibold text-gray-700">Response</th>
              <th className="text-left py-2 font-semibold text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {form.actorResponses.map((actor, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2">{actor.actor}</td>
                <td className="py-2">
                  <Select
                    value={actor.response}
                    onChange={(e) => {
                      const newResponses = [...form.actorResponses]
                      newResponses[idx].response = e.target.value
                      updateForm({ actorResponses: newResponses })
                    }}
                    options={['Not Applicable', 'Supportive', 'Opposed', 'Neutral', 'Acquiescence']}
                  />
                </td>
                <td className="py-2">
                  <Input
                    value={actor.notes}
                    onChange={(e) => {
                      const newResponses = [...form.actorResponses]
                      newResponses[idx].notes = e.target.value
                      updateForm({ actorResponses: newResponses })
                    }}
                    placeholder="Notes"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Challenges Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Challenges & Lessons Learned</h3>
        <textarea
          value={form.challenges}
          onChange={(e) => updateForm({ challenges: e.target.value })}
          placeholder="Describe any challenges and the lessons learned"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
          rows={4}
        />
      </Card>

      {/* New Contacts Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Outreach (New Contacts Made)</h3>
          <Button variant="secondary" onClick={addContact}>
            + Add Contact
          </Button>
        </div>

        {form.newContacts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Organisation</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Influence Level</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.newContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-100">
                    <td className="py-2">
                      <Input value={contact.name} onChange={(e) => updateContact(contact.id, { name: e.target.value })} placeholder="Name" />
                    </td>
                    <td className="py-2">
                      <Input value={contact.organisation} onChange={(e) => updateContact(contact.id, { organisation: e.target.value })} placeholder="Organisation" />
                    </td>
                    <td className="py-2">
                      <Input value={contact.email} onChange={(e) => updateContact(contact.id, { email: e.target.value })} placeholder="Email" type="email" />
                    </td>
                    <td className="py-2">
                      <Select
                        value={contact.influence}
                        onChange={(e) => updateContact(contact.id, { influence: e.target.value })}
                        options={['Slightly Influential', 'Very Influential']}
                      />
                    </td>
                    <td className="py-2">
                      <Select
                        value={contact.outreachType}
                        onChange={(e) => updateContact(contact.id, { outreachType: e.target.value })}
                        options={['Introduction', 'Collaboration', 'Membership', 'Fundraising']}
                      />
                    </td>
                    <td className="py-2">
                      <Button variant="danger" size="sm" onClick={() => removeContact(contact.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recommendations Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
        <textarea
          value={form.recommendations}
          onChange={(e) => updateForm({ recommendations: e.target.value })}
          placeholder="List recommendations based on work areas"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
          rows={4}
        />
      </Card>
    </div>
  )
}
