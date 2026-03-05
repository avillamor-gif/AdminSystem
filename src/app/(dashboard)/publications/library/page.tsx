'use client'

import React, { useState } from 'react'
import { BookOpen, ChevronDown, Library, Tag, Layers, Inbox, PrinterIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/components/ui'
import { usePublicationRequests } from '@/hooks/usePublications'

const CATEGORIES = ['book', 'journal', 'magazine', 'newsletter', 'report', 'manual', 'brochure', 'other', 'research']

export default function PublicationLibraryPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: library = [], isLoading } = usePublicationRequests({ request_type: 'catalogue', status: 'approved' })

  const filtered = library.filter(pub => {
    const title = ((pub as any).publication_title ?? '').toLowerCase()
    const author = (pub.publisher ?? '').toLowerCase()
    const isbn = (pub.isbn ?? '').toLowerCase()
    const q = search.toLowerCase()
    const matchSearch = !search || title.includes(q) || author.includes(q) || isbn.includes(q)
    const matchCategory = !categoryFilter || pub.publication_type === categoryFilter
    return matchSearch && matchCategory
  })

  const handleReset = () => {
    setSearch('')
    setCategoryFilter('')
  }

  const totalTitles = library.length
  const totalCategories = new Set(library.map(p => p.publication_type).filter(Boolean)).size
  const totalCopies = library.reduce((sum, p) => sum + (p.quantity ?? 0), 0)
  const totalPrinted = library.reduce((sum, p) => sum + ((p as any).total_printed ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Title & description */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publication Library</h1>
        <p className="text-gray-600 mt-1">Browse the full catalogue of available publications</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-orange-100 rounded-xl mb-3">
            <Library className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">{totalTitles}</p>
          <p className="text-sm text-gray-500">Total Titles</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Tag className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{totalCategories}</p>
          <p className="text-sm text-gray-500">Categories</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Layers className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{totalCopies}</p>
          <p className="text-sm text-gray-500">Qty Available</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 rounded-xl mb-3">
            <PrinterIcon className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-1">{totalPrinted}</p>
          <p className="text-sm text-gray-500">Total Printed</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full appearance-none border border-orange-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white pr-8"
              >
                <option value="">-- All --</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full sm:w-32 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Reset
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">({filtered.length}) Publications Found</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No publications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cover</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Printed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(pub => (
                  <tr key={pub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center" style={{ height: '64px', width: '48px' }}>
                        {(pub as any).cover_url
                          ? <img src={(pub as any).cover_url} alt="cover" className="w-full h-full object-cover" />
                          : <BookOpen className="w-5 h-5 text-gray-300" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 text-sm">
                      {(pub as any).publication_title ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {pub.publisher ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      {pub.publication_type ? (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium capitalize">
                          {pub.publication_type.charAt(0).toUpperCase() + pub.publication_type.slice(1)}
                        </span>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {pub.isbn ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const qty = pub.quantity ?? 0
                        const printed = (pub as any).total_printed ?? 0
                        const pct = printed > 0 ? qty / printed : 1
                        const color = qty === 0 ? 'text-red-600 font-semibold' : pct <= 0.2 ? 'text-orange-600 font-semibold' : 'text-gray-700 font-medium'
                        return (
                          <span className={`text-sm ${color}`}>
                            {qty}
                            {qty === 0 && <span className="ml-1 text-xs text-red-400">(none)</span>}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(pub as any).total_printed ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 whitespace-nowrap"
                        onClick={() => router.push(`/publications/request?publication_id=${(pub as any).publication_id}`)}
                      >
                        <Inbox className="w-3.5 h-3.5 mr-1" />Request
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
