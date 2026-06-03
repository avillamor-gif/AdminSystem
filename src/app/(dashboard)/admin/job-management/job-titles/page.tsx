'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { Card, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { 
  useJobTitles, 
  useCreateJobTitle, 
  useUpdateJobTitle, 
  useDeleteJobTitle,
  useEmploymentTypes,
  useDepartments,
} from '@/hooks'
import type { JobTitleInsert, JobTitleUpdate } from '@/services/jobTitle.service'

interface JobTitleForm {
  title: string
  code: string
  description: string
  department_id: string
  employment_type: string
  is_active: boolean
}

export default function JobTitlesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null)
  const [formData, setFormData] = useState<JobTitleForm>({
    title: '',
    code: '',
    description: '',
    department_id: '',
    employment_type: '',
    is_active: true,
  })

  // Fetch data from Supabase
  const { data: jobTitles = [], isLoading, error } = useJobTitles({ search: searchQuery })
  const createMutation = useCreateJobTitle()
  const updateMutation = useUpdateJobTitle()
  const deleteMutation = useDeleteJobTitle()
  const { data: employmentTypes = [] } = useEmploymentTypes()
  const { data: departments = [] } = useDepartments()

  const filteredTitles = jobTitles

  const activeCount = jobTitles.filter(t => t.is_active).length

  const handleEdit = (title: any) => {
    setSelectedTitleId(title.id)
    setFormData({
      title: title.title,
      code: title.code || '',
      description: title.description || '',
      department_id: title.department_id || '',
      employment_type: title.employment_type || '',
      is_active: title.is_active ?? true,
    })
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedTitleId(null)
    setFormData({
      title: '',
      code: '',
      description: '',
      department_id: '',
      employment_type: '',
      is_active: true,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      department_id: formData.department_id || null,
    }

    try {
      if (selectedTitleId) {
        // Update existing
        await updateMutation.mutateAsync({
          id: selectedTitleId,
          data: payload as JobTitleUpdate
        })
      } else {
        // Create new
        await createMutation.mutateAsync(payload as JobTitleInsert)
      }
      
      setIsFormOpen(false)
      setSelectedTitleId(null)
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedTitleId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading job titles...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error loading job titles. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Titles</h1>
          <p className="text-gray-600 mt-1">
            Manage job titles and positions across the organization
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Job Title
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Job Titles</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{jobTitles.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Titles</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {activeCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Positions</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {jobTitles.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Titles</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {activeCount}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by title, code, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employment Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTitles.map((title) => (
                <tr key={title.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{title.code || '-'}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{title.title}</div>
                      <div className="text-sm text-gray-500">{title.description || 'No description'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{departments.find(d => d.id === title.department_id)?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{title.employment_type || '-'}</td>
                  <td className="px-6 py-4">
                    <Badge className={title.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {title.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(title)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(title.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <Modal open={isFormOpen} onClose={handleCloseForm} size="lg">
        <ModalHeader onClose={handleCloseForm}>
          {selectedTitleId ? 'Edit Job Title' : 'Add New Job Title'}
        </ModalHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <ModalBody>
            <div className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the role"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  {employmentTypes.map((et) => (
                    <option key={et.id} value={et.name}>{et.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : selectedTitleId ? 'Update' : 'Create'} Job Title
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

