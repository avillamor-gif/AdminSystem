'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, TrendingUp, Target, Award, ArrowRight, X } from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useCareerPaths, useCreateCareerPath, useUpdateCareerPath, useDeleteCareerPath } from '@/hooks/useCareerPaths'

interface CareerLevel {
  title: string
  duration: string
  requirements: string[]
}

interface CareerPathFormData {
  name: string
  code: string
  category: string
  description: string
  levels: CareerLevel[]
  total_duration: string
  status: 'active' | 'draft' | 'archived'
}

export default function CareerPathsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPath, setEditingPath] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: careerPaths = [], isLoading } = useCareerPaths({
    search: searchQuery || undefined,
  })
  const createMutation = useCreateCareerPath()
  const updateMutation = useUpdateCareerPath()
  const deleteMutation = useDeleteCareerPath()

  const [formData, setFormData] = useState<CareerPathFormData>({
    name: '',
    code: '',
    category: '',
    description: '',
    levels: [],
    total_duration: '',
    status: 'draft',
  })

  const [currentLevel, setCurrentLevel] = useState<CareerLevel>({
    title: '',
    duration: '',
    requirements: [],
  })
  const [currentRequirement, setCurrentRequirement] = useState('')

  const handleOpenModal = (path?: any) => {
    if (path) {
      setEditingPath(path)
      setFormData({
        name: path.name || '',
        code: path.code || '',
        category: path.category || '',
        description: path.description || '',
        levels: path.levels || [],
        total_duration: path.total_duration || '',
        status: path.status || 'draft',
      })
    } else {
      setEditingPath(null)
      setFormData({
        name: '',
        code: '',
        category: '',
        description: '',
        levels: [],
        total_duration: '',
        status: 'draft',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPath(null)
    setCurrentLevel({ title: '', duration: '', requirements: [] })
    setCurrentRequirement('')
  }

  const handleAddRequirement = () => {
    if (currentRequirement.trim()) {
      setCurrentLevel({
        ...currentLevel,
        requirements: [...currentLevel.requirements, currentRequirement.trim()],
      })
      setCurrentRequirement('')
    }
  }

  const handleRemoveRequirement = (index: number) => {
    setCurrentLevel({
      ...currentLevel,
      requirements: currentLevel.requirements.filter((_, i) => i !== index),
    })
  }

  const handleAddLevel = () => {
    if (currentLevel.title && currentLevel.duration && currentLevel.requirements.length > 0) {
      setFormData({
        ...formData,
        levels: [...formData.levels, currentLevel],
      })
      setCurrentLevel({ title: '', duration: '', requirements: [] })
    }
  }

  const handleRemoveLevel = (index: number) => {
    setFormData({
      ...formData,
      levels: formData.levels.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code || !formData.category || formData.levels.length === 0) {
      return
    }

    const payload = {
      name: formData.name,
      code: formData.code,
      category: formData.category,
      description: formData.description || null,
      levels: formData.levels,
      total_duration: formData.total_duration || null,
      status: formData.status,
    }

    if (editingPath) {
      await updateMutation.mutateAsync({ id: editingPath.id, data: payload as any })
    } else {
      await createMutation.mutateAsync(payload as any)
    }

    handleCloseModal()
  }

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    setDeleteConfirm(null)
  }

  const filteredPaths = careerPaths

  const totalEmployees = 0 // Not tracked in current schema

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading career paths...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Paths</h1>
          <p className="text-gray-600 mt-1">
            Define career progression tracks and development opportunities
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Career Path
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Paths</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{careerPaths.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Paths</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {careerPaths.filter(p => p.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Draft Paths</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {careerPaths.filter(p => p.status === 'draft').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg Path Length</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {careerPaths.length > 0
              ? (careerPaths.reduce((sum, p) => sum + (Array.isArray(p.levels) ? p.levels.length : 0), 0) / careerPaths.length).toFixed(1)
              : '0'}{' '}
            levels
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search career paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="space-y-6">
        {filteredPaths.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No career paths found. Create one to get started.</p>
          </Card>
        ) : (
          filteredPaths.map((path) => (
            <Card key={path.id} className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{path.name}</h3>
                    <p className="text-sm text-gray-500">{path.code} • {path.category}</p>
                    {path.description && <p className="text-sm text-gray-600 mt-2">{path.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={
                    path.status === 'active' ? 'bg-green-100 text-green-800' :
                    path.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
                  }>
                    {path.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(path)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(path.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Career Levels</p>
                    <p className="text-lg font-bold text-gray-900">{path.levels?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Duration</p>
                    <p className="text-lg font-bold text-gray-900">{path.total_duration || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {path.levels && (path.levels as unknown as any[]).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Career Progression
                  </h4>
                  <div className="space-y-4">
                    {(path.levels as unknown as CareerLevel[]).map((level: CareerLevel, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              idx === 0 ? 'bg-green-100 text-green-700' :
                              idx === (path.levels as unknown as CareerLevel[]).length - 1 ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {idx + 1}
                            </div>
                            {idx < (path.levels as unknown as CareerLevel[]).length - 1 && (
                              <div className="w-0.5 h-16 bg-gray-300 my-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-gray-900">{level.title}</h5>
                                <p className="text-sm text-gray-500">Duration: {level.duration}</p>
                              </div>
                              {idx < (path.levels as unknown as CareerLevel[]).length - 1 && (
                                <ArrowRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            {level.requirements && level.requirements.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-600 uppercase">Key Requirements:</p>
                                <ul className="space-y-1">
                                  {level.requirements.map((req, reqIdx) => (
                                    <li key={reqIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={handleCloseModal}>
            {editingPath ? 'Edit Career Path' : 'Create Career Path'}
          </ModalHeader>
          <ModalBody className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Path Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Software Engineering Track"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Path Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CP-SE"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Engineering"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Duration
                  </label>
                  <Input
                    type="text"
                    value={formData.total_duration}
                    onChange={(e) => setFormData({ ...formData, total_duration: e.target.value })}
                    placeholder="e.g., 9-14 years"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the career path"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Career Levels */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Career Levels</h3>
              
              {/* Add Level Form */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level Title</label>
                  <Input
                    type="text"
                    value={currentLevel.title}
                    onChange={(e) => setCurrentLevel({ ...currentLevel, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <Input
                    type="text"
                    value={currentLevel.duration}
                    onChange={(e) => setCurrentLevel({ ...currentLevel, duration: e.target.value })}
                    placeholder="e.g., 3-4 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={currentRequirement}
                      onChange={(e) => setCurrentRequirement(e.target.value)}
                      placeholder="Add a requirement"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddRequirement()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddRequirement}>Add</Button>
                  </div>
                  {currentLevel.requirements.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {currentLevel.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{req}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddLevel}
                  disabled={!currentLevel.title || !currentLevel.duration || currentLevel.requirements.length === 0}
                  className="w-full"
                >
                  Add Level
                </Button>
              </div>

              {/* Current Levels */}
              {formData.levels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Current Levels ({formData.levels.length})</p>
                  {formData.levels.map((level, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">#{idx + 1}</span>
                            <h4 className="font-semibold text-gray-900">{level.title}</h4>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Duration: {level.duration}</p>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600">Requirements:</p>
                            <ul className="mt-1 space-y-0.5">
                              {level.requirements.map((req, reqIdx) => (
                                <li key={reqIdx} className="text-sm text-gray-600 ml-4">• {req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLevel(idx)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.levels.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No levels added yet. Add at least one level.</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.name ||
                !formData.code ||
                !formData.category ||
                formData.levels.length === 0 ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editingPath ? 'Update Path' : 'Create Path'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Career Path"
        message="Are you sure you want to delete this career path? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
