'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Input, Select } from '@/components/ui'
import { Download, Save, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'

interface Activity {
  id: string
  title: string
  type: string
  organiser: string
  level: string
  engagement: string
  thematicWork: string[]
  intersection: string[]
  roles: string[]
  highlights: string
  actorResponses: KeyActor[]
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
    activities: [{
      id: '1',
      title: '',
      type: '',
      organiser: '',
      level: '',
      engagement: '',
      thematicWork: [],
      intersection: [],
      roles: [],
      highlights: '',
      actorResponses: [
        { actor: '', response: 'Not Applicable', notes: '' },
      ]
    }],
    mainPositions: '',
    policyTrends: '',
    keyActors: '',
    allianceQuestion: '',
    challenges: '',
    newContacts: [],
    recommendations: '',
  })

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure activities array exists and has proper structure
        if (!parsed.activities || !Array.isArray(parsed.activities)) {
          parsed.activities = [{
            id: '1',
            title: '',
            type: '',
            organiser: '',
            level: '',
            engagement: '',
            thematicWork: [],
            intersection: [],
            roles: [],
            highlights: '',
            actorResponses: [
              { actor: '', response: 'Not Applicable', notes: '' },
            ]
          }]
        }
        // Ensure each activity has actorResponses
        parsed.activities = parsed.activities.map((activity: Activity) => ({
          ...activity,
          actorResponses: activity.actorResponses || [
            { actor: '', response: 'Not Applicable', notes: '' },
          ]
        }))
        setForm(parsed)
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
      activities: [...prev.activities, {
        id: newId,
        title: '',
        type: '',
        organiser: '',
        level: '',
        engagement: '',
        thematicWork: [],
        intersection: [],
        roles: [],
        highlights: '',
        actorResponses: [
          { actor: '', response: 'Not Applicable', notes: '' },
        ]
      }],
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
      pdf.setFont('helvetica', bold ? 'bold' : 'normal')
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Back to the Office Report</h2>
            <p className="text-sm text-gray-500 mt-1">Complete this form following your field visit or travel engagement.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))}>
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button size="sm" onClick={exportPDF}>
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Travel Information Section */}
      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Travel Information</h3>
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
              options={[
                { value: 'Fully Supported', label: 'Fully Supported' },
                { value: 'Partially Supported', label: 'Partially Supported' },
                { value: 'Self-funded', label: 'Self-funded' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Activities Section */}
      <Card className="p-5 space-y-0">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Activities</h3>

        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-green-50 text-xs font-semibold text-gray-700 border-b border-gray-300">
          <div className="col-span-2">Activity</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Organiser</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-2">Thematic</div>
          <div className="col-span-2">Intersection</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="space-y-0">
          {form.activities.map((activity, idx) => (
            <div key={activity.id} className={`grid grid-cols-12 gap-2 px-3 py-2 ${idx < form.activities.length - 1 ? 'border-b border-gray-200' : ''}`}>
              <div className="col-span-2">
                <Input 
                  value={activity.title} 
                  onChange={(e) => updateActivity(activity.id, { title: e.target.value })} 
                  placeholder="Activity"
                  className="text-xs h-8"
                />
              </div>
              <div className="col-span-2">
                <Select
                  value={activity.type}
                  onChange={(e) => updateActivity(activity.id, { type: e.target.value })}
                  options={[
                    { value: '', label: '- Select -' },
                    { value: 'Forum/Conference', label: 'Forum/Conference' },
                    { value: 'Training', label: 'Training' },
                    { value: 'Meeting', label: 'Meeting' },
                    { value: 'Workshop', label: 'Workshop' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <Input 
                  value={activity.organiser} 
                  onChange={(e) => updateActivity(activity.id, { organiser: e.target.value })} 
                  placeholder="Organiser"
                  className="text-xs h-8"
                />
              </div>
              <div className="col-span-1">
                <Select
                  value={activity.level}
                  onChange={(e) => updateActivity(activity.id, { level: e.target.value })}
                  options={[
                    { value: '', label: '- Select -' },
                    { value: 'Global', label: 'Global' },
                    { value: 'Regional', label: 'Regional' },
                    { value: 'National', label: 'National' },
                    { value: 'Local', label: 'Local' },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <Select
                  value={activity.engagement}
                  onChange={(e) => updateActivity(activity.id, { engagement: e.target.value })}
                  options={[
                    { value: '', label: '- Select -' },
                    { value: 'Climate', label: 'Climate' },
                    { value: 'Gender', label: 'Gender' },
                    { value: 'Trade', label: 'Trade' },
                    { value: 'Militarism', label: 'Militarism' },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <select 
                  multiple 
                  value={activity.intersection} 
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                    updateActivity(activity.id, { intersection: selected })
                  }}
                  className="w-full px-2 py-1 text-xs h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange"
                >
                  <option value="Gender">Gender</option>
                  <option value="Trade">Trade</option>
                  <option value="Climate">Climate</option>
                  <option value="Militarism">Militarism</option>
                  <option value="DevCoop">DevCoop</option>
                </select>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                {form.activities.length > 1 && (
                  <button
                    onClick={() => removeActivity(activity.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addActivity} className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4">
          + Add More Activities
        </button>
      </Card>

      {/* Reflections Section */}
      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Reflections</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Who are the key actors in the activities and what are their response/s?</label>
          </div>
        </div>
      </Card>

      {/* Key Actors Response Table - One per Activity */}
      {form.activities.map((activity) => (
        <Card key={activity.id} className="p-5 space-y-0">
          {/* Activity Card Header */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Activity Card:</span> {activity.title || 'Untitled'}
            </p>
          </div>
          
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-green-100 text-xs font-bold text-gray-900">
            <div className="col-span-4">Key Actors</div>
            <div className="col-span-3">Response</div>
            <div className="col-span-4">Notes</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          <div className="space-y-0">
            {activity.actorResponses.map((actor, idx) => {
              const allActors = ['State Actors', 'CSOs', 'POs and Social Movements', 'Multilateral Institutions', 'Private Sector', 'Media', 'Donors']
              const selectedActors = activity.actorResponses.map(a => a.actor)
              const availableActors = allActors.filter(a => a === actor.actor || !selectedActors.includes(a))
              
              return (
                <div key={idx} className={`grid grid-cols-12 gap-3 px-4 py-2 ${idx < activity.actorResponses.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="col-span-4">
                    <Select
                      value={actor.actor}
                      onChange={(e) => {
                        const newActivities = form.activities.map(a => {
                          if (a.id === activity.id) {
                            const newResponses = [...a.actorResponses]
                            newResponses[idx].actor = e.target.value
                            return { ...a, actorResponses: newResponses }
                          }
                          return a
                        })
                        updateForm({ activities: newActivities })
                      }}
                      options={[
                        { value: '', label: '- Select Actor -' },
                        ...availableActors.map(a => ({ value: a, label: a }))
                      ]}
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={actor.response}
                      onChange={(e) => {
                        const newActivities = form.activities.map(a => {
                          if (a.id === activity.id) {
                            const newResponses = [...a.actorResponses]
                            newResponses[idx].response = e.target.value
                            return { ...a, actorResponses: newResponses }
                          }
                          return a
                        })
                        updateForm({ activities: newActivities })
                      }}
                      options={[
                        { value: 'Not Applicable', label: 'Not Applicable' },
                        { value: 'Supportive', label: 'Supportive' },
                        { value: 'Opposed', label: 'Opposed' },
                        { value: 'Neutral', label: 'Neutral' },
                        { value: 'Acquiescence', label: 'Acquiescence' },
                      ]}
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      value={actor.notes}
                      onChange={(e) => {
                        const newActivities = form.activities.map(a => {
                          if (a.id === activity.id) {
                            const newResponses = [...a.actorResponses]
                            newResponses[idx].notes = e.target.value
                            return { ...a, actorResponses: newResponses }
                          }
                          return a
                        })
                        updateForm({ activities: newActivities })
                      }}
                      placeholder="Notes"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    {activity.actorResponses.length > 1 && (
                      <button
                        onClick={() => {
                          const newActivities = form.activities.map(a => {
                            if (a.id === activity.id) {
                              const newResponses = a.actorResponses.filter((_, i) => i !== idx)
                              return { ...a, actorResponses: newResponses }
                            }
                            return a
                          })
                          updateForm({ activities: newActivities })
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {/* Challenges Section */}
      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Challenges & Lessons Learned</h3>
        <textarea
          value={form.challenges}
          onChange={(e) => updateForm({ challenges: e.target.value })}
          placeholder="Describe any challenges and the lessons learned"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
          rows={4}
        />
      </Card>

      {/* New Contacts Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">Outreach (New Contacts Made)</h3>
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
                        options={[
                          { value: 'Slightly Influential', label: 'Slightly Influential' },
                          { value: 'Very Influential', label: 'Very Influential' },
                        ]}
                      />
                    </td>
                    <td className="py-2">
                      <Select
                        value={contact.outreachType}
                        onChange={(e) => updateContact(contact.id, { outreachType: e.target.value })}
                        options={[
                          { value: 'Introduction', label: 'Introduction' },
                          { value: 'Collaboration', label: 'Collaboration' },
                          { value: 'Membership', label: 'Membership' },
                          { value: 'Fundraising', label: 'Fundraising' },
                        ]}
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
      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Recommendations</h3>
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
