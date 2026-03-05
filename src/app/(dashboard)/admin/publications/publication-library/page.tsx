'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Trash2, BookOpen, FileText, Inbox } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, Button, Badge, Input } from '@/components/ui'
import {
  usePublicationRequests,
  useDeletePublicationRequest,
} from '@/hooks/usePublications'

const PUBLICATION_TYPES = ['book', 'journal', 'magazine', 'newsletter', 'report', 'manual', 'brochure', 'other']

const typeColor: Record<string, string> = {
  book: 'bg-blue-100 text-blue-700',
  journal: 'bg-purple-100 text-purple-700',
  magazine: 'bg-pink-100 text-pink-700',
  newsletter: 'bg-yellow-100 text-yellow-700',
  report: 'bg-orange-100 text-orange-700',
  manual: 'bg-green-100 text-green-700',
  brochure: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
}

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
    (p as any).publication_title?.toLowerCase().includes(search.toLowerCase()) ||
    p.publisher?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('Delete this publication?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publication Library</h1>
          <p className="text-gray-600 mt-1">Manage all approved publications</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => router.push('/admin/publications/add-publication')}>
          <Plus className="w-4 h-4 mr-2" />Add Publication
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input placeholder="Search by title or publisher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {PUBLICATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No publications yet</p>
          <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={() => router.push('/admin/publications/add-publication')}>
            <Plus className="w-4 h-4 mr-2" />Add First Publication
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              {/* Cover */}
              <div className="relative w-full aspect-[3/4] bg-gray-100 shrink-0">
                {(item as any).cover_url ? (
                  <img src={(item as any).cover_url} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                    <span className="text-xs text-gray-400">No cover</span>
                  </div>
                )}
                {(item as any).pdf_url && (
                  <a
                    href={(item as any).pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-orange-50"
                    title="View PDF"
                  >
                    <FileText className="w-4 h-4 text-orange-600" />
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={typeColor[item.publication_type ?? 'other'] ?? 'bg-gray-100 text-gray-700'}>
                    {item.publication_type}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                  {(item as any).publication_title}
                </h3>
                {item.publisher && <p className="text-xs text-gray-500">{item.publisher}</p>}
                {item.isbn && <p className="text-xs text-gray-400">ISBN: {item.isbn}</p>}
                {item.quantity != null && (
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                )}

                {/* Admin actions */}
                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 justify-center"
                    onClick={() => router.push(`/admin/publications/publication-management?publication_id=${(item as any).publication_id}`)}
                  >
                    <Inbox className="w-3.5 h-3.5 mr-1" />Requests
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => router.push(`/admin/publications/add-publication?id=${item.id}`)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
