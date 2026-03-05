'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, FileText, Eye, X } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import {
  useJobDescriptions,
  useCreateJobDescription,
  useUpdateJobDescription,
  useDeleteJobDescription,
} from '@/hooks/useJobDescriptions'

type FormData = {
  title: string
  code: string
  summary: string
  responsibilities: string[]
  qualifications: string[]
  skills: string[]
  status: 'active' | 'draft' | 'archived'
}

const emptyForm: FormData = {
  title: '',
  code: '',
  summary: '',
  responsibilities: [],
  qualifications: [],
  skills: [],
  status: 'draft',
}

export default function JobDescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDesc, setSelectedDesc] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [respInput, setRespInput] = useState('')
  const [qualInput, setQualInput] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const { data: jobDescriptions = [], isLoading } = useJobDescriptions({})
  const createMutation = useCreateJobDescription()
  const updateMutation = useUpdateJobDescription()
  const deleteMutation = useDeleteJobDescription()

  const filteredDescriptions = jobDescriptions.filter((desc: any) =>
    (desc.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (desc.code ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (desc.department ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (desc: any) => {
    setSelectedDesc(desc)
    setViewMode(true)
  }

  const handleEdit = (desc: any) => {
    setSelectedDesc(desc)
    setFormData({
      title: desc.title ?? '',
      code: desc.code ?? '',
      summary: desc.summary ?? '',
      responsibilities: Array.isArray(desc.responsibilities) ? desc.responsibilities : [],
      qualifications: Array.isArray(desc.qualifications) ? desc.qualifications : [],
      skills: Array.isArray(desc.skills) ? desc.skills : [],
      status: desc.status ?? 'draft',
    })
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedDesc(null)
    setFormData(emptyForm)
    setRespInput('')
    setQualInput('')
    setSkillInput('')
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedDesc) {
        await updateMutation.mutateAsync({ id: selectedDesc.id, data: formData as any })
      } else {
        await createMutation.mutateAsync(formData as any)
      }
      setIsFormOpen(false)
      setSelectedDesc(null)
    } catch {
      // errors handled by mutation hooks
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this job description?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedDesc(null)
  }

  const handleCloseView = () => {
    setViewMode(false)
    setSelectedDesc(null)
  }

  // Array helpers
  const addResponsibility = () => {
    if (respInput.trim()) {
      setFormData({ ...formData, responsibilities: [...formData.responsibilities, respInput.trim()] })
      setRespInput('')
    }
  }
  const removeResponsibility = (index: number) => {
    setFormData({ ...formData, responsibilities: formData.responsibilities.filter((_, i) => i !== index) })
  }

  const addQualification = () => {
    if (qualInput.trim()) {
      setFormData({ ...formData, qualifications: [...formData.qualifications, qualInput.trim()] })
      setQualInput('')
    }
  }
  const removeQualification = (index: number) => {
    setFormData({ ...formData, qualifications: formData.qualifications.filter((_, i) => i !== index) })
  }

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] })
      setSkillInput('')
    }
  }
  const removeSkill = (index: number) => {
    setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="text-gray-600 mt-1">Create and manage detailed job descriptions</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job Description
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Descriptions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{jobDescriptions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {jobDescriptions.filter((d: any) => d.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Draft</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {jobDescriptions.filter((d: any) => d.status === 'draft').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Archived</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">
            {jobDescriptions.filter((d: any) => d.status === 'archived').length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search job descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading job descriptions...</div>
      ) : filteredDescriptions.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No job descriptions found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDescriptions.map((desc: any) => {
            const responsibilities: string[] = Array.isArray(desc.responsibilities) ? desc.responsibilities : []
            const skills: string[] = Array.isArray(desc.skills) ? desc.skills : []
            return (
              <Card key={desc.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{desc.title}</h3>
                      <p className="text-sm text-gray-500">{desc.code} • {desc.department}</p>
                    </div>
                  </div>
                  <Badge className={
                    desc.status === 'active' ? 'bg-green-100 text-green-800' :
                    desc.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
                  }>
                    {desc.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-4">{desc.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Key Responsibilities ({responsibilities.length})
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {responsibilities.slice(0, 3).map((resp, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} className="bg-gray-100 text-gray-700 text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {desc.experience_required ? `Experience: ${desc.experience_required}` : ''}
                    {desc.updated_at ? ` • Updated: ${new Date(desc.updated_at).toLocaleDateString()}` : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(desc)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(desc)}>
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(desc.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* View Modal */}
      {viewMode && selectedDesc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedDesc.title}</h2>
                <p className="text-sm text-gray-500">{selectedDesc.code} • {selectedDesc.department}</p>
              </div>
              <button onClick={handleCloseView} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <Badge className={
                selectedDesc.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedDesc.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600'
              }>
                {selectedDesc.status}
              </Badge>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Summary</h3>
                <p className="text-gray-700">{selectedDesc.summary}</p>
              </div>

              {Array.isArray(selectedDesc.responsibilities) && selectedDesc.responsibilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
                  <ul className="space-y-2">
                    {selectedDesc.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedDesc.qualifications) && selectedDesc.qualifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Qualifications</h3>
                  <ul className="space-y-2">
                    {selectedDesc.qualifications.map((qual: string, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0" />
                        <span>{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedDesc.skills) && selectedDesc.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDesc.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-blue-50 text-blue-700">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {selectedDesc.experience_required && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience Required</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedDesc.experience_required}</p>
                  </div>
                )}
                {selectedDesc.education_required && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Education Required</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedDesc.education_required}</p>
                  </div>
                )}
                {selectedDesc.updated_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedDesc.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <Button variant="secondary" onClick={handleCloseView}>Close</Button>
              <Button onClick={() => { handleCloseView(); handleEdit(selectedDesc) }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDesc ? 'Edit Job Description' : 'Create Job Description'}
              </h2>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                    <Input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Code *</label>
                    <Input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., SE001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Summary</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief overview of the position"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={respInput}
                      onChange={(e) => setRespInput(e.target.value)}
                      placeholder="Add a responsibility"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addResponsibility() } }}
                    />
                    <Button type="button" onClick={addResponsibility} variant="secondary">Add</Button>
                  </div>
                  <ul className="space-y-2">
                    {formData.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{resp}</span>
                        <button type="button" onClick={() => removeResponsibility(idx)} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={qualInput}
                      onChange={(e) => setQualInput(e.target.value)}
                      placeholder="Add a qualification"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQualification() } }}
                    />
                    <Button type="button" onClick={addQualification} variant="secondary">Add</Button>
                  </div>
                  <ul className="space-y-2">
                    {formData.qualifications.map((qual, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{qual}</span>
                        <button type="button" onClick={() => removeQualification(idx)} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    />
                    <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-blue-50 text-blue-700 flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => removeSkill(idx)} className="ml-1 hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <Button type="button" variant="secondary" onClick={handleCloseForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (selectedDesc ? 'Update' : 'Create') + ' Job Description'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
