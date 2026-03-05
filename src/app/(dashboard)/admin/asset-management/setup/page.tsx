'use client'

import { useState } from 'react'
import { useAssetCategories, useCreateAssetCategory, useUpdateAssetCategory, useDeleteAssetCategory, useAssetBrands, useCreateAssetBrand, useUpdateAssetBrand, useDeleteAssetBrand, useAssetVendors, useCreateAssetVendor, useUpdateAssetVendor, useDeleteAssetVendor, type AssetCategory, type AssetBrand, type AssetVendor } from '@/hooks/useAssets'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Plus, Edit, Trash2, Package, Tag, Building } from 'lucide-react'

type TabType = 'categories' | 'brands' | 'vendors'

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories')
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', is_active: true })
  const [brandForm, setBrandForm] = useState({ name: '', description: '', is_active: true })
  const [vendorForm, setVendorForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', is_active: true })

  // Categories
  const { data: categories = [] } = useAssetCategories()
  const createCategory = useCreateAssetCategory()
  const updateCategory = useUpdateAssetCategory()
  const deleteCategory = useDeleteAssetCategory()

  // Brands
  const { data: brands = [] } = useAssetBrands()
  const createBrand = useCreateAssetBrand()
  const updateBrand = useUpdateAssetBrand()
  const deleteBrand = useDeleteAssetBrand()

  // Vendors
  const { data: vendors = [] } = useAssetVendors()
  const createVendor = useCreateAssetVendor()
  const updateVendor = useUpdateAssetVendor()
  const deleteVendor = useDeleteAssetVendor()

  const categoryStats = {
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length
  }

  const brandStats = {
    total: brands.length,
    active: brands.filter(b => b.is_active).length,
    inactive: brands.filter(b => !b.is_active).length
  }

  const vendorStats = {
    total: vendors.length,
    active: vendors.filter(v => v.is_active).length,
    inactive: vendors.filter(v => !v.is_active).length
  }

  const handleOpenModal = (item?: any) => {
    if (activeTab === 'categories') {
      if (item) {
        setSelectedItem(item)
        setCategoryForm({ name: item.name, description: item.description || '', icon: item.icon || '', is_active: item.is_active })
      } else {
        setSelectedItem(null)
        setCategoryForm({ name: '', description: '', icon: '', is_active: true })
      }
    } else if (activeTab === 'brands') {
      if (item) {
        setSelectedItem(item)
        setBrandForm({ name: item.name, description: item.description || '', is_active: item.is_active })
      } else {
        setSelectedItem(null)
        setBrandForm({ name: '', description: '', is_active: true })
      }
    } else if (activeTab === 'vendors') {
      if (item) {
        setSelectedItem(item)
        setVendorForm({ name: item.name, contact_person: item.contact_person || '', email: item.email || '', phone: item.phone || '', address: item.address || '', is_active: item.is_active })
      } else {
        setSelectedItem(null)
        setVendorForm({ name: '', contact_person: '', email: '', phone: '', address: '', is_active: true })
      }
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (activeTab === 'categories') {
        if (selectedItem) {
          await updateCategory.mutateAsync({ id: selectedItem.id, data: categoryForm })
        } else {
          await createCategory.mutateAsync(categoryForm)
        }
      } else if (activeTab === 'brands') {
        if (selectedItem) {
          await updateBrand.mutateAsync({ id: selectedItem.id, data: brandForm })
        } else {
          await createBrand.mutateAsync(brandForm)
        }
      } else if (activeTab === 'vendors') {
        if (selectedItem) {
          await updateVendor.mutateAsync({ id: selectedItem.id, data: vendorForm })
        } else {
          await createVendor.mutateAsync(vendorForm)
        }
      }
      setShowModal(false)
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      if (activeTab === 'categories') {
        await deleteCategory.mutateAsync(id)
      } else if (activeTab === 'brands') {
        await deleteBrand.mutateAsync(id)
      } else if (activeTab === 'vendors') {
        await deleteVendor.mutateAsync(id)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{categoryStats.total}</p>
          <p className="text-sm text-gray-500">Total Categories</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{categoryStats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-gray-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-3xl font-bold text-gray-500 mb-1">{categoryStats.inactive}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Asset Categories</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map(category => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{category.description || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.icon && <span className="text-2xl">{category.icon}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(category)} title="Edit" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(category.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderBrands = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Tag className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{brandStats.total}</p>
          <p className="text-sm text-gray-500">Total Brands</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Tag className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{brandStats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-gray-100 rounded-xl mb-3">
            <Tag className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-3xl font-bold text-gray-500 mb-1">{brandStats.inactive}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Asset Brands</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brands.map(brand => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{brand.description || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${brand.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(brand)} title="Edit" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(brand.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderVendors = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{vendorStats.total}</p>
          <p className="text-sm text-gray-500">Total Vendors</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Building className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{vendorStats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-gray-100 rounded-xl mb-3">
            <Building className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-3xl font-bold text-gray-500 mb-1">{vendorStats.inactive}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Asset Vendors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contact_person || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(vendor)} title="Edit" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(vendor.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories & Setup</h1>
          <p className="text-gray-600">Manage asset categories, brands, and vendors</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Vendor'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="inline-block h-5 w-5 mr-2" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'brands'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="inline-block h-5 w-5 mr-2" />
            Brands
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vendors'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="inline-block h-5 w-5 mr-2" />
            Vendors
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && renderCategories()}
      {activeTab === 'brands' && renderBrands()}
      {activeTab === 'vendors' && renderVendors()}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setShowModal(false)}>
            {selectedItem ? 'Edit' : 'Add'} {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Vendor'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {activeTab === 'categories' && (
                <>
                  <Input
                    label="Name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Icon (Emoji)"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="📦"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="category_active"
                      checked={categoryForm.is_active}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="category_active" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'brands' && (
                <>
                  <Input
                    label="Name"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      value={brandForm.description}
                      onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="brand_active"
                      checked={brandForm.is_active}
                      onChange={(e) => setBrandForm({ ...brandForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="brand_active" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'vendors' && (
                <>
                  <Input
                    label="Name"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Contact Person"
                    value={vendorForm.contact_person}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vendor_active"
                      checked={vendorForm.is_active}
                      onChange={(e) => setVendorForm({ ...vendorForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="vendor_active" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedItem ? 'Update' : 'Add'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
