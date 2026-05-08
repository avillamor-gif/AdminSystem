'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Trash2, BookOpen, Plus, Eye } from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import { usePublicationRequests, useDeletePublicationRequest } from '@/hooks/usePublications'

const PUBLICATION_TYPES = ['book', 'journal', 'magazine', 'newsletter', 'report', 'manual', 'brochure', 'other']

export default function PublicationLibraryPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data: publications = [], isLoading } = usePublicationRequests({
    request_type: 'catalogue',
    publication_type: typeFilter || undefined,
  })
  const deleteMutation = useDeletePublicationRequest()

  const filtered = publications.filter(p =>
    !search ||
    p.publication_title?.toLowerCase().includes(search.toLowerCase()) ||
    p.publisher?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('Delete this publication from the library?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch {}
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publication Library</h1>
          <p className="text-gray-600 mt-1">Catalogue of all available publications</p>
        </div>
        <Button onClick={() => router.push('/admin/publications/add-publication')}>
          <Plus className="w-4 h-4 mr-2" />Add Publication
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search by title or publisher..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {PUBLICATION_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Library Catalogue</h3>
          <span className="text-sm text-gray-500">{filtered.length} publication{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No publications in the library yet</p>
            <Button className="mt-4" onClick={() => router.push('/admin/publications/add-publication')}>
              <Plus className="w-4 h-4 mr-2" />Add First Publication
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publisher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(pub => (
                  <tr key={pub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{pub.publication_title}</div>
                      {pub.request_number && <div className="text-xs text-gray-400">{pub.request_number}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-blue-100 text-blue-700 capitalize">{pub.publication_type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pub.publisher || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{pub.isbn || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{pub.quantity ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View copy requests"
                          onClick={() => router.push(`/admin/publications/publication-management?publication_id=${pub.id}`)}
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(pub.id)}
                          disabled={deleteMutation.isPending}
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
      </Card>
    </div>
  )
}
