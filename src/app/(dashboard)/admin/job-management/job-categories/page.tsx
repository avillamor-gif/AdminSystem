'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Briefcase, Users, X } from 'lucide-react'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useJobCategories, useCreateJobCategory, useUpdateJobCategory, useDeleteJobCategory } from '@/hooks/useJobCategories'
import type { JobCategory } from '@/services/jobCategory.service'

interface CategoryFormData {
  name: string
  code: string
  description: string
  is_active: boolean
}

export default function JobCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    code: '',
    description: '',
    is_active: true
  })
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({})

  const { data: jobCategories = [], isLoading } = useJobCategories({ search: searchQuery })
  const createMutation = useCreateJobCategory()
  const updateMutation = useUpdateJobCategory()
  const deleteMutation = useDeleteJobCategory()

  const filteredCategories = jobCategories

  const activeCategories = jobCategories.filter(c => c.is_active).length

  const handleOpenModal = (category?: JobCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        code: category.code,
        description: category.description || '',
        is_active: category.is_active
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        is_active: true
      })
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    })
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Partial<CategoryFormData> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!formData.code.trim()) {
      errors.code = 'Code is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: formData
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const colorClasses: Record<number, { bg: string; text: string; icon: string }> = {
    0: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
    1: { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'text-purple-600' },
    2: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
    3: { bg: 'bg-pink-100', text: 'text-pink-800', icon: 'text-pink-600' },
    4: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-600' },
    5: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-600' },
    6: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-600' },
    7: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-600' },
    8: { bg: 'bg-rose-100', text: 'text-rose-800', icon: 'text-rose-600' },
    9: { bg: 'bg-teal-100', text: 'text-teal-800', icon: 'text-teal-600' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Categories</h1>
          <p className="text-gray-600 mt-1">
            Organize positions into functional categories and groups
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{jobCategories.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Categories</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCategories}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Inactive Categories</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{jobCategories.length - activeCategories}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Parent Categories</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {jobCategories.filter(c => !c.parent_id).length}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search job categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category, index) => {
          const colors = colorClasses[index % 10] || colorClasses[0]
          return (
            <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Briefcase className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(category.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{category.code}</p>
                <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <Badge className={
                  category.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first category'}
          </p>
          {!searchQuery && (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="lg">
        <ModalHeader onClose={handleCloseModal}>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Engineering & Technology"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Code <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CAT-ENG"
                  className={formErrors.code ? 'border-red-500' : ''}
                />
                {formErrors.code && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}