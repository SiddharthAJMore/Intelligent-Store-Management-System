import React, {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import {formatDate} from '../utils/formatters'
import {createUser, getUsers, toggleUserStatus, updateUser} from '../api/users'

const ROLES = [
  { id: 1, label: 'ADMIN' },
  { id: 2, label: 'CASHIER' },
]

const INITIAL_FORM = { username: '', email: '', password: '', roleId: '' }

function UserModal({ isOpen, onClose, onSave, initialData, loading }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const isEdit = !!initialData?.id

  useEffect(() => {
    if (isOpen) {
      setForm(
        isEdit
          ? { username: initialData.username, email: initialData.email || '', password: '', roleId: String(initialData.roleId || '') }
          : INITIAL_FORM
      )
      setErrors({})
    }
  }, [isOpen, initialData, isEdit])

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (!isEdit && !form.password) errs.password = 'Password is required'
    if (!form.roleId) errs.roleId = 'Role is required'
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
    const payload = { username: form.username, email: form.email, roleId: Number(form.roleId) }
    if (!isEdit) payload.password = form.password
    onSave(payload)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Username" name="username" value={form.username} onChange={handleChange}
          error={errors.username} required placeholder="Enter username" />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange}
          error={errors.email} required placeholder="user@example.com" />
        {!isEdit && (
          <Input label="Password" name="password" type="password" value={form.password}
            onChange={handleChange} error={errors.password} required placeholder="Enter password" />
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>
          <select name="roleId" value={form.roleId} onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white
              ${errors.roleId ? 'border-red-400' : 'border-gray-300'}`}>
            <option value="">Select role</option>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {errors.roleId && <p className="text-xs text-red-600">{errors.roleId}</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Update' : 'Add'} User
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getUsers({ page, size: 10 })
        const d = res.data?.data || res.data
        setUsers(d?.content || d || [])
        setTotalPages(d?.totalPages ?? 1)
      } catch {
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page]) // Only re-run when page changes

  const openAdd = () => { setEditData(null); setModalOpen(true) }
  const openEdit = (u) => {
    setEditData({ ...u, roleId: String(u.roleId || (u.role === 'ADMIN' ? 1 : 2)) })
    setModalOpen(true)
  }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editData?.id) {
        await updateUser(editData.id, form)
        toast.success('User updated')
      } else {
        await createUser(form)
        toast.success('User added')
      }
      setModalOpen(false)
      // Reload users
      const res = await getUsers({ page, size: 10 })
      const d = res.data?.data || res.data
      setUsers(d?.content || d || [])
      setTotalPages(d?.totalPages ?? 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (u) => {
    try {
      await toggleUserStatus(u.id, !u.active)
      toast.success(`User ${!u.active ? 'activated' : 'deactivated'}`)
      // Reload users
      const res = await getUsers({ page, size: 10 })
      const d = res.data?.data || res.data
      setUsers(d?.content || d || [])
      setTotalPages(d?.totalPages ?? 1)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const headers = ['Username', 'Email', 'Role', 'Status', 'Created At', 'Actions']

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <Button onClick={openAdd}>+ Add User</Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={headers}
                rows={users}
                emptyMessage="No users found"
                renderRow={(u) => (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'purple' : 'info'}>
                        {u.role || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.active ? 'success' : 'danger'}>
                        {u.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(u)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            u.active
                              ? 'text-red-600 hover:bg-red-50 border-red-200'
                              : 'text-green-600 hover:bg-green-50 border-green-200'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
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

      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
        loading={saving}
      />
    </Layout>
  )
}
