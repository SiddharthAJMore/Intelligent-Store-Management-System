import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatCurrency } from '../utils/formatters'
import { getProducts, createProduct, updateProduct, toggleProductStatus } from '../api/products'
import { getCategories } from '../api/categories'

const INITIAL_FORM = { name: '', categoryId: '', price: '', unit: '', sku: '' }

function ProductModal({ isOpen, onClose, onSave, initialData, categories, loading }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm(initialData || INITIAL_FORM)
      setErrors({})
    }
  }, [isOpen, initialData])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.categoryId) errs.categoryId = 'Category is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = 'Valid price is required'
    if (!form.lowStockThreshold || isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) <= 0)
      errs.lowStockThreshold = 'Valid threshold is required'
    if (!form.unit.trim()) errs.unit = 'Unit is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ ...form, price: Number(form.price), categoryId: Number(form.categoryId) })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" name="name" value={form.name} onChange={handleChange}
          error={errors.name} required placeholder="e.g. Basmati Rice" />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white
              ${errors.categoryId ? 'border-red-400' : 'border-gray-300'}`}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (₹)" name="price" type="number" step="0.01" min="0"
            value={form.price} onChange={handleChange} error={errors.price} required placeholder="0.00" />
          <Input label="Unit" name="unit" value={form.unit} onChange={handleChange}
            error={errors.unit} required placeholder="e.g. kg, pcs, litre" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="SKU" name="sku" value={form.sku} onChange={handleChange}
            placeholder="Optional SKU code" />
          <Input label="Low Stock Threshold" name="lowStockThreshold" type="number" step="1" min="0"
                 value={form.lowStockThreshold} onChange={handleChange} error={errors.lowStockThreshold} placeholder="0" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {initialData?.id ? 'Update' : 'Add'} Product
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [sortBy, setSortBy] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')

  // Load categories once on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories()
        const d = res.data?.data || res.data
        const cats = d?.content || d || []
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    loadCategories()
  }, []) // Empty deps - run once

  // Load products when filters or sort change
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = { page, size: 10, sortBy, direction: sortDirection }
        if (search) params.search = search
        if (filterCategory) params.category = filterCategory
        if (filterStatus !== '') params.active = filterStatus === 'active'
        const res = await getProducts(params)
        const d = res.data?.data || res.data
        setProducts(d?.content || d || [])
        setTotalPages(d?.totalPages ?? 1)
      } catch {
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search, filterCategory, filterStatus, sortBy, sortDirection]) // Re-run when sort changes too

  const openAdd = () => { setEditData(null); setModalOpen(true) }
  const openEdit = (p) => {
    setEditData({ ...p, categoryId: String(p.categoryId || p.category?.id || '') })
    setModalOpen(true)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const SortableHeader = ({ children, field }) => {
    const isActive = sortBy === field
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1.5 hover:text-green-700 font-medium transition-colors"
      >
        {children}
        <span className="text-xs">
          {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    )
  }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editData?.id) {
        await updateProduct(editData.id, form)
        toast.success('Product updated successfully')
      } else {
        await createProduct(form)
        toast.success('Product added successfully')
      }
      setModalOpen(false)
      // Reload products with current sort
      const params = { page, size: 10, sortBy, direction: sortDirection }
      if (search) params.search = search
      if (filterCategory) params.category = filterCategory
      if (filterStatus !== '') params.active = filterStatus === 'active'
      const res = await getProducts(params)
      const d = res.data?.data || res.data
      setProducts(d?.content || d || [])
      setTotalPages(d?.totalPages ?? 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (p) => {
    try {
      await toggleProductStatus(p.id, !p.active)
      toast.success(`Product ${!p.active ? 'activated' : 'deactivated'}`)
      // Reload products with current sort
      const params = { page, size: 10, sortBy, direction: sortDirection }
      if (search) params.search = search
      if (filterCategory) params.category = filterCategory
      if (filterStatus !== '') params.active = filterStatus === 'active'
      const res = await getProducts(params)
      const d = res.data?.data || res.data
      setProducts(d?.content || d || [])
      setTotalPages(d?.totalPages ?? 1)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const headers = [
    <SortableHeader field="name">Name</SortableHeader>,
    <SortableHeader field="categoryName">Category</SortableHeader>,
    <SortableHeader field="price">Price</SortableHeader>,
    <SortableHeader field="unit">Unit</SortableHeader>,
    <SortableHeader field="sku">SKU</SortableHeader>,
    <SortableHeader field="isActive">Status</SortableHeader>,
    'Actions'
  ]

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <Button onClick={openAdd}>+ Add Product</Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={headers}
                rows={products}
                emptyMessage="No products found"
                renderRow={(p) => (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.categoryName || p.category?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.active ? 'success' : 'danger'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(p)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                            p.active
                              ? 'text-red-600 hover:bg-red-50 border-red-200'
                              : 'text-green-600 hover:bg-green-50 border-green-200'
                          }`}
                        >
                          {p.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              />
              <div className="px-4">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
        categories={categories}
        loading={saving}
      />
    </Layout>
  )
}
