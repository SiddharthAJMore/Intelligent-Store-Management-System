import React, {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Table from '../components/common/Table'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Pagination from '../components/common/Pagination'
import {formatDate} from '../utils/formatters'
import {createCategory, deleteCategory, getCategories, updateCategory} from '../api/categories'

const INITIAL_FORM = { name: '', description: '' }

function CategoryModal({ isOpen, onClose, onSave, initialData, loading }) {
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
    onSave(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" name="name" value={form.name} onChange={handleChange}
          error={errors.name} required placeholder="e.g. Dairy & Eggs" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Optional description..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {initialData?.id ? 'Update' : 'Add'} Category
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({ isOpen, onClose, onConfirm, name, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Category" maxWidth="max-w-sm">
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          Are you sure you want to delete <span className="font-semibold text-gray-800">"{name}"</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">Delete</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCategories()
        const d = res.data?.data || res.data
        const cats = d?.content || d || []
        setCategories(Array.isArray(cats) ? cats : [])
      } catch {
        toast.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // Empty deps - run once on mount

  const paged = categories.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(categories.length / pageSize)

  const openAdd = () => { setEditData(null); setModalOpen(true) }
  const openEdit = (c) => { setEditData(c); setModalOpen(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editData?.id) {
        await updateCategory(editData.id, form)
        toast.success('Category updated')
      } else {
        await createCategory(form)
        toast.success('Category added')
      }
      setModalOpen(false)
      // Reload categories
      const res = await getCategories()
      const d = res.data?.data || res.data
      const cats = d?.content || d || []
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteCategory(deleteTarget.id)
      toast.success('Category deleted')
      setDeleteTarget(null)
      // Reload categories
      const res = await getCategories()
      const d = res.data?.data || res.data
      const cats = d?.content || d || []
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const headers = ['Name', 'Description', 'Created At', 'Actions']

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <Button onClick={openAdd}>+ Add Category</Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={headers}
                rows={paged}
                emptyMessage="No categories found"
                renderRow={(c) => (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                        >
                          Delete
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

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
        loading={saving}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.name}
        loading={saving}
      />
    </Layout>
  )
}
