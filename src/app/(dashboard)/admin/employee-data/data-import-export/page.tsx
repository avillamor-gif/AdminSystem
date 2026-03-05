'use client'

import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Clock, File } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useDataImports } from '@/hooks/useEmployeeData'
import toast from 'react-hot-toast'

export default function DataImportExportPage() {
  const [dragActive, setDragActive] = useState(false)
  const { data: importLogs = [], isLoading } = useDataImports()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files: FileList) => {
    const file = files[0]
    if (file) {
      toast.success(`File "${file.name}" uploaded. Processing...`)
      // Handle file upload
    }
  }

  const handleExport = (format: 'csv' | 'excel') => {
    toast.success(`Exporting employee data as ${format.toUpperCase()}...`)
    // Handle export
  }

  const stats = {
    total: importLogs.length,
    completed: importLogs.filter(l => l.status === 'completed').length,
    failed: importLogs.filter(l => l.status === 'failed').length,
    processing: importLogs.filter(l => l.status === 'processing').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Import/Export</h1>
        <p className="text-gray-600 mt-1">
          Import employee data from CSV/Excel or export current data
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Imports</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Processing</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Drag and drop your file here</p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleChange}
                className="hidden"
              />
              <span className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-dark transition-colors">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Browse Files
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-4">Supported: CSV, Excel (.xlsx, .xls)</p>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">Import Guidelines:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Employee ID must be unique</li>
              <li>• Email addresses must be valid</li>
              <li>• Dates should be in YYYY-MM-DD format</li>
              <li>• Department and job titles must exist in system</li>
            </ul>
          </div>
        </Card>

        {/* Export Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Export to CSV</h4>
                    <p className="text-sm text-gray-500">Download as comma-separated values</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => handleExport('csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Export to Excel</h4>
                    <p className="text-sm text-gray-500">Download as Excel spreadsheet</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => handleExport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">Export Options:</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                <span className="text-sm text-gray-600">Include personal information</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                <span className="text-sm text-gray-600">Include contact details</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-600">Include salary information</span>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Import History */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Import History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">File Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Records</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Success</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Failed</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {importLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{log.file_name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <Badge className="bg-blue-100 text-blue-700 capitalize">
                      {log.import_type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{log.total_records}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{log.successful_records}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{log.failed_records}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {log.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </Badge>
                      )}
                      {log.status === 'processing' && (
                        <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Processing
                        </Badge>
                      )}
                      {log.status === 'failed' && (
                        <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(log.started_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {importLogs.length === 0 && (
        <Card className="p-12 text-center">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No import history</h3>
          <p className="text-gray-600">Import your first employee data file to get started</p>
        </Card>
      )}
    </div>
  )
}
