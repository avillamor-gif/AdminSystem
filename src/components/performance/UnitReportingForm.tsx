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
  thematicWork: string
  intersection: string[]
  roles: string
  highlights: string
}

interface IIActivity {
  id: string
  title: string
  type: string
  partners: string
  thematicWork: string
  intersection: string[]
  participants: string[]
  estimatedNumber: string
  capacities: string
  fundingSupport: string
  fundingPartner: string
}

interface Publication {
  id: string
  title: string
  type: string
  coPublishers: string
  disseminationActivity: string
  disseminationMode: string
  intersection: string[]
  recipients: string[]
  citations: string
}

interface CommunicationOutput {
  id: string
  title: string
  type: string
  collaborators: string
  relatedActivities: string
  intersection: string[]
  recipients: string[]
  citations: string
  engagement: string
}

interface Fundraising {
  id: string
  projectTitle: string
  targetDonor: string
  thematicWork: string
  fundingType: string
  proposalType: string
  duration: string
  budget: string
  proposalLink: string
  status: string
}

interface URFFormState {
  unitName: string
  unitType: string
  year: string
  periodCovered: string
  externalEngagements: Activity[]
  iiActivities: IIActivity[]
  publications: Publication[]
  communicationOutputs: CommunicationOutput[]
  fundraising: Fundraising[]
}

const DRAFT_STORAGE_KEY = 'urf-draft-v1'

export default function UnitReportingForm({
  initialUnitName = '',
  initialUnitType = '',
}: {
  initialUnitName?: string
  initialUnitType?: string
}) {
  const [form, setForm] = useState<URFFormState>({
    unitName: initialUnitName,
    unitType: initialUnitType,
    year: new Date().getFullYear().toString(),
    periodCovered: '',
    externalEngagements: [{ id: '1', title: '', type: '', organiser: '', level: '', thematicWork: '', intersection: [], roles: '', highlights: '' }],
    iiActivities: [{ id: '1', title: '', type: '', partners: '', thematicWork: '', intersection: [], participants: [], estimatedNumber: '', capacities: '', fundingSupport: '', fundingPartner: '' }],
    publications: [{ id: '1', title: '', type: '', coPublishers: '', disseminationActivity: '', disseminationMode: '', intersection: [], recipients: [], citations: '' }],
    communicationOutputs: [{ id: '1', title: '', type: '', collaborators: '', relatedActivities: '', intersection: [], recipients: [], citations: '', engagement: '' }],
    fundraising: [{ id: '1', projectTitle: '', targetDonor: '', thematicWork: '', fundingType: '', proposalType: '', duration: '', budget: '', proposalLink: '', status: '' }],
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

  const updateForm = (updates: Partial<URFFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const addActivity = (type: 'external' | 'ii' | 'publication' | 'communication' | 'fundraising') => {
    const newId = String(Date.now())
    setForm((prev) => {
      if (type === 'external') {
        return {
          ...prev,
          externalEngagements: [...prev.externalEngagements, { id: newId, title: '', type: '', organiser: '', level: '', thematicWork: '', intersection: [], roles: '', highlights: '' }],
        }
      } else if (type === 'ii') {
        return {
          ...prev,
          iiActivities: [...prev.iiActivities, { id: newId, title: '', type: '', partners: '', thematicWork: '', intersection: [], participants: [], estimatedNumber: '', capacities: '', fundingSupport: '', fundingPartner: '' }],
        }
      } else if (type === 'publication') {
        return {
          ...prev,
          publications: [...prev.publications, { id: newId, title: '', type: '', coPublishers: '', disseminationActivity: '', disseminationMode: '', intersection: [], recipients: [], citations: '' }],
        }
      } else if (type === 'communication') {
        return {
          ...prev,
          communicationOutputs: [...prev.communicationOutputs, { id: newId, title: '', type: '', collaborators: '', relatedActivities: '', intersection: [], recipients: [], citations: '', engagement: '' }],
        }
      } else {
        return {
          ...prev,
          fundraising: [...prev.fundraising, { id: newId, projectTitle: '', targetDonor: '', thematicWork: '', fundingType: '', proposalType: '', duration: '', budget: '', proposalLink: '', status: '' }],
        }
      }
    })
  }

  const removeActivity = (id: string, type: 'external' | 'ii' | 'publication' | 'communication' | 'fundraising') => {
    setForm((prev) => {
      if (type === 'external') {
        return { ...prev, externalEngagements: prev.externalEngagements.filter((a) => a.id !== id) }
      } else if (type === 'ii') {
        return { ...prev, iiActivities: prev.iiActivities.filter((a) => a.id !== id) }
      } else if (type === 'publication') {
        return { ...prev, publications: prev.publications.filter((a) => a.id !== id) }
      } else if (type === 'communication') {
        return { ...prev, communicationOutputs: prev.communicationOutputs.filter((a) => a.id !== id) }
      } else {
        return { ...prev, fundraising: prev.fundraising.filter((a) => a.id !== id) }
      }
    })
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

    addLine('UNIT REPORTING FORM', 14, true)
    addLine(`Unit: ${form.unitName}`, 11)
    addLine(`Type: ${form.unitType}`, 11)
    addLine(`Year: ${form.year}`, 11)
    addLine('')

    pdf.save(`URF_${form.unitName}_${form.year}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Unit Reporting Form</h2>
            <p className="text-sm text-gray-500 mt-1">Annual reporting on engagements, activities, research, communications, and fundraising.</p>
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

      {/* Unit Information */}
      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Unit Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Unit Name" value={form.unitName} onChange={(e) => updateForm({ unitName: e.target.value })} />
          <Input label="Type of Unit" value={form.unitType} onChange={(e) => updateForm({ unitType: e.target.value })} />
          <Input label="Year" type="number" value={form.year} onChange={(e) => updateForm({ year: e.target.value })} />
          <Input label="Period Covered" placeholder="e.g., Jan-Dec 2026" value={form.periodCovered} onChange={(e) => updateForm({ periodCovered: e.target.value })} />
        </div>
      </Card>

      {/* Part I: External Engagements */}
      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part I: Engagements (External; Non-II)</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-100 border-b-2 border-gray-400">
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Activity</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Type</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Organiser</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Level</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Thematic</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Intersection</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Role/s</th>
                <th className="border border-gray-400 px-3 py-3 text-left text-xs font-bold text-gray-900">Highlight/s</th>
                <th className="border border-gray-400 px-3 py-3 text-center text-xs font-bold text-gray-900 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.externalEngagements.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2">
                    <Input value={activity.title} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, title: e.target.value } : a) }))} placeholder="Title" className="text-xs h-8 border-0 bg-transparent p-1" />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <Select value={activity.type} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, type: e.target.value } : a) }))} options={[{ value: '', label: '- Select -' }, { value: 'Forum', label: 'Forum' }, { value: 'Conference', label: 'Conference' }]} />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <Input value={activity.organiser} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, organiser: e.target.value } : a) }))} placeholder="Organiser" className="text-xs h-8 border-0 bg-transparent p-1" />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <Select value={activity.level} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, level: e.target.value } : a) }))} options={[{ value: '', label: '- Select -' }, { value: 'Global', label: 'Global' }, { value: 'Regional', label: 'Regional' }]} />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <Select value={activity.thematicWork} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, thematicWork: e.target.value } : a) }))} options={[{ value: '', label: '- Select -' }, { value: 'Climate', label: 'Climate' }, { value: 'Gender', label: 'Gender' }]} />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="space-y-0.5">
                      {['Gender', 'Trade', 'Climate'].map((item) => (
                        <label key={item} className="flex items-center gap-1 text-xs cursor-pointer">
                          <input type="checkbox" checked={activity.intersection.includes(item)} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, intersection: e.target.checked ? [...a.intersection, item] : a.intersection.filter(i => i !== item) } : a) }))} className="w-3 h-3 accent-orange" />
                          <span className="text-xs">{item}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <Input value={activity.roles} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, roles: e.target.value } : a) }))} placeholder="Role" className="text-xs h-8 border-0 bg-transparent p-1" />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <textarea value={activity.highlights} onChange={(e) => setForm(prev => ({ ...prev, externalEngagements: prev.externalEngagements.map(a => a.id === activity.id ? { ...a, highlights: e.target.value } : a) }))} placeholder="Highlights" className="w-full px-1 py-0.5 text-xs border-0 bg-transparent focus:outline-none resize-none" rows={1} />
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {form.externalEngagements.length > 1 && (
                      <button onClick={() => removeActivity(activity.id, 'external')} className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={() => addActivity('external')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          + Add More Activities
        </button>
      </Card>

      {/* Part II: II-Organised Activities */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Part II: II-Organised Activities</h3>
          <Button variant="secondary" size="sm" onClick={() => addActivity('ii')}>
            + Add Activity
          </Button>
        </div>
        <p className="text-sm text-gray-500">Activities organized or co-organized by the unit.</p>
        {form.iiActivities.length > 0 && (
          <div className="space-y-3 border border-gray-300 rounded-lg p-3">
            {form.iiActivities.map((activity) => (
              <div key={activity.id} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Input label="Title" value={activity.title} onChange={(e) => setForm(prev => ({ ...prev, iiActivities: prev.iiActivities.map(a => a.id === activity.id ? { ...a, title: e.target.value } : a) }))} placeholder="Activity title" />
                  <Input label="Co-organizers/Partners" value={activity.partners} onChange={(e) => setForm(prev => ({ ...prev, iiActivities: prev.iiActivities.map(a => a.id === activity.id ? { ...a, partners: e.target.value } : a) }))} placeholder="Partners" />
                  <Input label="Estimated # of Participants" value={activity.estimatedNumber} onChange={(e) => setForm(prev => ({ ...prev, iiActivities: prev.iiActivities.map(a => a.id === activity.id ? { ...a, estimatedNumber: e.target.value } : a) }))} type="number" />
                  <Input label="Funding Partner" value={activity.fundingPartner} onChange={(e) => setForm(prev => ({ ...prev, iiActivities: prev.iiActivities.map(a => a.id === activity.id ? { ...a, fundingPartner: e.target.value } : a) }))} placeholder="Funder" />
                </div>
                {form.iiActivities.length > 1 && <Button variant="danger" size="sm" onClick={() => removeActivity(activity.id, 'ii')} className="mt-2">Remove</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Part III: Research */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Part III: Research (PBs, Primers, Reports, Publications)</h3>
          <Button variant="secondary" size="sm" onClick={() => addActivity('publication')}>
            + Add Publication
          </Button>
        </div>
        {form.publications.length > 0 && (
          <div className="space-y-3 border border-gray-300 rounded-lg p-3">
            {form.publications.map((pub) => (
              <div key={pub.id} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Input label="Title" value={pub.title} onChange={(e) => setForm(prev => ({ ...prev, publications: prev.publications.map(p => p.id === pub.id ? { ...p, title: e.target.value } : p) }))} />
                  <Select label="Type" value={pub.type} onChange={(e) => setForm(prev => ({ ...prev, publications: prev.publications.map(p => p.id === pub.id ? { ...p, type: e.target.value } : p) }))} options={[{ value: '', label: '- Select -' }, { value: 'Policy Brief', label: 'Policy Brief' }, { value: 'Primer', label: 'Primer' }, { value: 'Report', label: 'Report' }]} />
                </div>
                {form.publications.length > 1 && <Button variant="danger" size="sm" onClick={() => removeActivity(pub.id, 'publication')} className="mt-2">Remove</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Part IV: Communication Outputs */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Part IV: Communication Outputs (Socmed, Media, Other)</h3>
          <Button variant="secondary" size="sm" onClick={() => addActivity('communication')}>
            + Add Output
          </Button>
        </div>
        {form.communicationOutputs.length > 0 && (
          <div className="space-y-3 border border-gray-300 rounded-lg p-3">
            {form.communicationOutputs.map((output) => (
              <div key={output.id} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Input label="Title" value={output.title} onChange={(e) => setForm(prev => ({ ...prev, communicationOutputs: prev.communicationOutputs.map(o => o.id === output.id ? { ...o, title: e.target.value } : o) }))} />
                  <Select label="Type" value={output.type} onChange={(e) => setForm(prev => ({ ...prev, communicationOutputs: prev.communicationOutputs.map(o => o.id === output.id ? { ...o, type: e.target.value } : o) }))} options={[{ value: '', label: '- Select -' }, { value: 'Social Media', label: 'Social Media' }, { value: 'Media Landing', label: 'Media Landing' }, { value: 'Website', label: 'Website' }]} />
                  <Input label="Engagement & Reach" value={output.engagement} onChange={(e) => setForm(prev => ({ ...prev, communicationOutputs: prev.communicationOutputs.map(o => o.id === output.id ? { ...o, engagement: e.target.value } : o) }))} type="number" placeholder="# of engagements" />
                </div>
                {form.communicationOutputs.length > 1 && <Button variant="danger" size="sm" onClick={() => removeActivity(output.id, 'communication')} className="mt-2">Remove</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Part V: Fundraising */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Part V: Fundraising</h3>
          <Button variant="secondary" size="sm" onClick={() => addActivity('fundraising')}>
            + Add Proposal
          </Button>
        </div>
        {form.fundraising.length > 0 && (
          <div className="space-y-3 border border-gray-300 rounded-lg p-3">
            {form.fundraising.map((fr) => (
              <div key={fr.id} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <Input label="Project Title" value={fr.projectTitle} onChange={(e) => setForm(prev => ({ ...prev, fundraising: prev.fundraising.map(f => f.id === fr.id ? { ...f, projectTitle: e.target.value } : f) }))} />
                  <Input label="Target Donor" value={fr.targetDonor} onChange={(e) => setForm(prev => ({ ...prev, fundraising: prev.fundraising.map(f => f.id === fr.id ? { ...f, targetDonor: e.target.value } : f) }))} />
                  <Select label="Status" value={fr.status} onChange={(e) => setForm(prev => ({ ...prev, fundraising: prev.fundraising.map(f => f.id === fr.id ? { ...f, status: e.target.value } : f) }))} options={[{ value: '', label: '- Select -' }, { value: 'Drafting', label: 'Drafting' }, { value: 'Submitted', label: 'Submitted' }, { value: 'Funded', label: 'Funded' }, { value: 'Rejected', label: 'Rejected' }]} />
                  <Input label="Proposed Budget" value={fr.budget} onChange={(e) => setForm(prev => ({ ...prev, fundraising: prev.fundraising.map(f => f.id === fr.id ? { ...f, budget: e.target.value } : f) }))} type="number" />
                  <Input label="Duration" value={fr.duration} onChange={(e) => setForm(prev => ({ ...prev, fundraising: prev.fundraising.map(f => f.id === fr.id ? { ...f, duration: e.target.value } : f) }))} placeholder="e.g., 12 months" />
                  <Input label="Proposal Document Link" value={fr.proposalLink} onChange={(e) => setForm(prev => ({ ...prev, fundraising: prev.fundraising.map(f => f.id === fr.id ? { ...f, proposalLink: e.target.value } : f) }))} placeholder="URL" />
                </div>
                {form.fundraising.length > 1 && <Button variant="danger" size="sm" onClick={() => removeActivity(fr.id, 'fundraising')} className="mt-2">Remove</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
