'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  type Holiday,
} from '@/hooks/useLeaveAbsence'
import { Plus, Edit, Trash2, Search, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

const holidaySchema = z.object({
  holiday_name: z.string().min(1, 'Name is required'),
  holiday_date: z.string().min(1, 'Date is required'),
  holiday_type: z.enum(['regular', 'special_non_working', 'special_working']),
  is_recurring: z.boolean(),
  is_paid: z.boolean(),
  is_mandatory: z.boolean(),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type HolidayForm = z.infer<typeof holidaySchema>

export default function HolidayCalendarPage() {
  const currentYear = new Date().getFullYear()
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState<number>(currentYear)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)

  const { data: holidays = [], isLoading } = useHolidays({ year: yearFilter })
  const createMutation = useCreateHoliday()
  const updateMutation = useUpdateHoliday()
  const deleteMutation = useDeleteHoliday()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidayForm>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      holiday_type: 'regular',
      is_recurring: false,
      is_paid: true,
      is_mandatory: false,
      is_active: true,
    },
  })

  const filteredHolidays = useMemo(() => {
    return holidays.filter((holiday) => {
      const matchesSearch =
        searchTerm === '' ||
        holiday.holiday_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === '' || holiday.holiday_type === typeFilter
      return matchesSearch && matchesType
    })
  }, [holidays, searchTerm, typeFilter])

  const statistics = useMemo(() => {
    const total = holidays.length
    const byType = holidays.reduce((acc, h) => {
      acc[h.holiday_type] = (acc[h.holiday_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const currentYearCount = holidays.filter((h) => {
      const year = new Date(h.holiday_date).getFullYear()
      return year === currentYear
    }).length
    return { total, byType, currentYearCount }
  }, [holidays, currentYear])

  const handleOpenModal = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday)
      reset({
        holiday_name: holiday.holiday_name,
        holiday_date: holiday.holiday_date,
        holiday_type: holiday.holiday_type as any,
        is_recurring: holiday.is_recurring,
        is_paid: holiday.is_paid,
        is_mandatory: holiday.is_mandatory,
        description: holiday.description || '',
        is_active: holiday.is_active,
      })
    } else {
      setEditingHoliday(null)
      reset({
        holiday_type: 'regular',
        is_recurring: false,
        is_paid: true,
        is_mandatory: false,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingHoliday(null)
    reset()
  }

  const onSubmit = async (data: HolidayForm) => {
    try {
      const submitData = {
        ...data,
        year: new Date(data.holiday_date).getFullYear(),
      }
      console.log('Submitting holiday data:', submitData)
      if (editingHoliday) {
        await updateMutation.mutateAsync({ id: editingHoliday.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error submitting holiday:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      regular: 'success',
      special_non_working: 'warning',
      special_working: 'default',
    }
    return variants[type] || 'default'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      regular: 'Regular Holidays',
      special_non_working: 'Special (Non-Working) Holidays',
      special_working: 'Special (Working) Holidays',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-600 mt-1">
            Manage public holidays and company-wide non-working days
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Holidays</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Current Year</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.currentYearCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Regular Holidays</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.byType.regular || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Special Non-Working</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{statistics.byType.special_non_working || 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="regular">Regular Holidays</option>
            <option value="special_non_working">Special (Non-Working) Holidays</option>
            <option value="special_working">Special (Working) Holidays</option>
          </select>
        </div>
      </Card>

      {/* Holidays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holiday Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredHolidays.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No holidays found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Holiday Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Recurring
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Paid
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Mandatory
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHolidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{holiday.holiday_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(holiday.holiday_date), 'MMMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getTypeBadgeVariant(holiday.holiday_type)}>
                          {getTypeLabel(holiday.holiday_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {holiday.is_recurring ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={holiday.is_paid ? 'success' : 'default'}>
                          {holiday.is_paid ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {holiday.is_mandatory ? (
                          <Badge variant="warning">Yes</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={holiday.is_active ? 'success' : 'danger'}>
                          {holiday.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(holiday)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(holiday.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader onClose={handleCloseModal}>
            {editingHoliday ? 'Edit Holiday' : 'Create Holiday'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Holiday Name"
                {...register('holiday_name')}
                error={errors.holiday_name?.message}
                required
              />
              <Input
                type="date"
                label="Holiday Date"
                {...register('holiday_date')}
                error={errors.holiday_date?.message}
                required
              />
              <Select
                label="Holiday Type"
                {...register('holiday_type')}
                error={errors.holiday_type?.message}
                required
              >
                <option value="regular">Regular Holidays</option>
                <option value="special_non_working">Special (Non-Working) Holidays</option>
                <option value="special_working">Special (Working) Holidays</option>
              </Select>
              <Input
                label="Description"
                {...register('description')}
                error={errors.description?.message}
              />
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_recurring')} className="rounded" />
                  <span className="text-sm">Recurring Annually</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_paid')} className="rounded" />
                  <span className="text-sm">Paid Holiday</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_mandatory')} className="rounded" />
                  <span className="text-sm">Mandatory</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_active')} className="rounded" />
                  <span className="text-sm">Active</span>
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
              {editingHoliday ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
