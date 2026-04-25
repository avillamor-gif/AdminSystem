'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, Pencil, Eye } from 'lucide-react'
import { Card, Button, Input, Badge, Avatar } from '@/components/ui'
import { useEmployees } from '@/hooks/useEmployees'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import type { EmployeeWithRelations } from '@/services/employee.service'
import { IDCard } from './components/IDCard'
import { IDCardEditor } from './components/IDCardEditor'
import { useEmployeeAttachments } from '@/hooks/useEmployeeAttachments'
import { useIDCardLayout } from './hooks/useIDCardLayout'
import { createClient } from '@/lib/supabase/client'

function GenerateIDContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front')
  const [editMode, setEditMode] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef  = useRef<HTMLDivElement>(null)

  const { data: employees = [], isLoading } = useEmployees({ search: searchQuery })
  const typedEmployees = employees as EmployeeWithRelations[]
  const selectedEmployeeData = typedEmployees.find(e => e.id === selectedEmployeeId) ?? null

  const { data: emergencyContacts = [] } = useEmergencyContacts(selectedEmployeeId ?? '')
  const primaryContact = emergencyContacts[0] ?? null

  const { data: attachments = [] } = useEmployeeAttachments(selectedEmployeeId ?? '')
  const signatureAttachment = attachments.find((a: any) => a.document_type === 'e-signature')

  // Generate a signed URL for the signature (bucket is private)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!signatureAttachment?.file_path) { setSignatureUrl(null); return }
    const supabase = createClient()
    supabase.storage.from('attachments').createSignedUrl(signatureAttachment.file_path, 3600)
      .then(({ data }: { data: { signedUrl: string } | null }) => setSignatureUrl(data?.signedUrl ?? null))
  }, [signatureAttachment?.file_path])

  const { frontLayout, backLayout, bgFront, bgBack, bgGalleryFront, bgGalleryBack, addBg, selectBg, removeBg, overlayFront, overlayBack, setCustomOverlay, updateElement, saveLayout, resetLayout } = useIDCardLayout()

  const stats = {
    totalEmployees: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    terminated: employees.filter(e => e.status === 'terminated').length,
  }

  const handlePrint = async () => {
    if (!selectedEmployeeData) return
    const html2canvas = (await import('html2canvas')).default

    const html2canvasOpts = {
      scale: 5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    }

    const baseName = `ID_${selectedEmployeeData.employee_id}_${selectedEmployeeData.last_name}`

    const download = (dataUrl: string, filename: string) => {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      a.click()
    }

    if (frontRef.current) {
      const canvas = await html2canvas(frontRef.current, html2canvasOpts)
      download(canvas.toDataURL('image/jpeg', 0.98), `${baseName}_front.jpg`)
    }
    if (backRef.current) {
      const canvas = await html2canvas(backRef.current, html2canvasOpts)
      download(canvas.toDataURL('image/jpeg', 0.98), `${baseName}_back.jpg`)
    }
  }

  const employeeWithContact = {
    ...selectedEmployeeData as any,
    emergency_contact_name: primaryContact?.name,
    emergency_contact_phone: primaryContact?.mobile_phone,
    signature_url: signatureUrl ?? undefined,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate ID</h1>
        <p className="text-gray-600 mt-1">Preview and print employee ID cards</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Inactive</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.inactive}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Terminated</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.terminated}</div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Employee List */}
        <div className="col-span-4">
          <Card>
            <div className="p-4 border-b border-gray-200">
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange border-t-transparent" />
                </div>
              ) : typedEmployees.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">No employees found</p>
              ) : (
                typedEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedEmployeeId === employee.id ? 'bg-orange-50 border-l-4 border-orange' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={employee.avatar_url}
                        firstName={employee.first_name}
                        lastName={employee.last_name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{employee.employee_id}</p>
                      </div>
                      <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                        {employee.status}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ID Preview Panel */}
        <div className="col-span-8">
          {selectedEmployeeData ? (
            <div className="space-y-6">
              {/* Employee Header — same as Employee Records */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={selectedEmployeeData.avatar_url}
                      firstName={selectedEmployeeData.first_name}
                      lastName={selectedEmployeeData.last_name}
                      size="lg"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
                      </h2>
                      <p className="text-gray-600">{selectedEmployeeData.employee_id}</p>
                    </div>
                  </div>
                  <Button onClick={handlePrint}>
                    <Download className="w-4 h-4 mr-2" />
                    Export ID
                  </Button>
                </div>
              </Card>

              {/* ID Card Preview */}
              <Card>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">ID Card Preview</h3>
                  <div className="flex gap-2 items-center">
                    {!editMode && (
                      <>
                        <button
                          onClick={() => setCardSide('front')}
                          className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            cardSide === 'front'
                              ? 'bg-orange text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Front
                        </button>
                        <button
                          onClick={() => setCardSide('back')}
                          className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            cardSide === 'back'
                              ? 'bg-orange text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Back
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditMode(m => !m)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                        editMode
                          ? 'bg-orange text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {editMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      {editMode ? 'Preview' : 'Edit Design'}
                    </button>
                  </div>
                </div>

                {editMode ? (
                  /* ── Edit Mode ── */
                  <div className="p-6 space-y-4">
                    {/* Side tabs inside editor */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCardSide('front')}
                        className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          cardSide === 'front' ? 'bg-orange text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Front
                      </button>
                      <button
                        onClick={() => setCardSide('back')}
                        className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          cardSide === 'back' ? 'bg-orange text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Back
                      </button>
                    </div>
                    <IDCardEditor
                      side={cardSide}
                      layout={cardSide === 'front' ? frontLayout : backLayout}
                      employee={employeeWithContact}
                      onUpdateElement={(id, patch) => updateElement(cardSide, id, patch)}
                      onSave={saveLayout}
                      onReset={resetLayout}
                      bgGallery={cardSide === 'front' ? bgGalleryFront : bgGalleryBack}
                      onAddBg={(dataUrl) => addBg(cardSide, dataUrl)}
                      onSelectBg={(idx) => selectBg(cardSide, idx)}
                      onRemoveBg={(idx) => removeBg(cardSide, idx)}
                      overlayImage={cardSide === 'front' ? overlayFront : overlayBack}
                      onUploadOverlay={(dataUrl) => setCustomOverlay(cardSide, dataUrl)}
                    />
                  </div>
                ) : (
                  /* ── Preview Mode ── */
                  <div className="p-8 flex justify-center">
                    {/* Visible preview */}
                    <IDCard
                      employee={employeeWithContact}
                      side={cardSide}
                      layout={cardSide === 'front' ? frontLayout : backLayout}
                      bgImage={cardSide === 'front' ? bgFront : bgBack}
                      overlayImage={cardSide === 'front' ? overlayFront : overlayBack}
                    />
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employee selected</h3>
              <p className="text-gray-600">Select an employee from the list to preview their ID card</p>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden cards for PDF — always in DOM, positioned far off-screen so html2canvas can render them (visibility:hidden breaks canvas) */}
      <div style={{ position: 'fixed', top: 0, left: '-99999px', pointerEvents: 'none' }}>
        <IDCard ref={frontRef} employee={employeeWithContact} side="front" layout={frontLayout} bgImage={bgFront} overlayImage={overlayFront} forPrint />
        <IDCard ref={backRef} employee={employeeWithContact} side="back" layout={backLayout} bgImage={bgBack} overlayImage={overlayBack} forPrint />
      </div>
    </div>
  )
}

export default function GenerateIDPage() {
  return (
    <ProtectedRoute requiredRole={['Admin']}>
      <GenerateIDContent />
    </ProtectedRoute>
  )
}
