import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'

export interface PayComponentFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: any) => void | Promise<void>
  initialData?: any
  loading?: boolean
}

const componentTypes = [
  { value: 'basic', label: 'Basic Salary' },
  { value: 'rata', label: 'RATA (Representation & Transportation Allowance)' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'night_diff', label: 'Night Differential' },
  { value: 'holiday_pay', label: 'Holiday Pay' },
  { value: 'thirteenth_month', label: '13th Month Pay' },
  { value: 'other', label: 'Other' },
]

export function PayComponentForm({ open, onClose, onSave, initialData, loading }: PayComponentFormProps) {
  const [form, setForm] = useState(initialData || {
    name: '',
    type: '',
    taxable: true,
    amount: '',
  })
  useEffect(() => {
    setForm(initialData || {
      name: '',
      type: '',
      taxable: true,
      amount: '',
    })
  }, [initialData])

  const handleChange = (field: string, value: any) => {
    setForm((f: any) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation
    if (!form.name.trim() || !form.type || form.amount === '' || isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      return
    }
    onSave({
      ...form,
      amount: Number(form.amount),
    })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          {initialData ? 'Edit Pay Component' : 'Add Pay Component'}
        </ModalHeader>
        <ModalBody className="space-y-5">
          <Input
            label="Component Name"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            required
            id="paycomp-name"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={e => handleChange('type', e.target.value)}
            required
            options={componentTypes}
            id="paycomp-type"
            placeholder="Select type"
          />
          <Input
            label="Amount (PHP)"
            type="number"
            value={form.amount}
            onChange={e => {
              const val = e.target.value
              if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0)) {
                handleChange('amount', val)
              }
            }}
            required
            min={0}
            id="paycomp-amount"
            inputMode="decimal"
            aria-describedby="paycomp-amount-desc"
          />
          <span id="paycomp-amount-desc" className="sr-only">Enter a non-negative number</span>
          <div className="flex items-center gap-2 pt-1">
            <input
              id="paycomp-taxable"
              type="checkbox"
              checked={form.taxable}
              onChange={e => handleChange('taxable', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              aria-checked={form.taxable}
              aria-label="Taxable"
            />
            <label htmlFor="paycomp-taxable" className="text-sm text-gray-700 select-none cursor-pointer">
              Taxable
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
