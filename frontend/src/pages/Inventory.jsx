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
import {formatDate, formatNumber} from '../utils/formatters'
import {getInventory, getMovements, stockIn} from '../api/inventory'
import {getCategories} from "../api/categories.js";

function StockInModal({ isOpen, onClose, onSave, product, loading }) {
  const [form, setForm] = useState({ quantity: '', notes: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) { setForm({ quantity: '', notes: '' }); setErrors({}) }
  }, [isOpen])

  const validate = () => {
    const errs = {}
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      errs.quantity = 'Valid quantity is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ productId: product?.productId, quantity: Number(form.quantity), notes: form.notes })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock In" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Product</label>
          <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-semibold text-gray-800 border border-gray-200">
            {product?.productName}
          </p>
          <p className="text-xs text-gray-400 mt-1">Current stock: {product?.quantity ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Low Stock Threshold: {product?.lowStockThreshold ?? 0}</p>
        </div>
        <Input
          label="Quantity to Add"
          name="quantity"
          type="number"
          min="1"
          value={form.quantity}
          onChange={(e) => {
            setForm((p) => ({ ...p, quantity: e.target.value }))
            if (errors.quantity) setErrors((p) => ({ ...p, quantity: '' }))
          }}
          error={errors.quantity}
          required
          placeholder="Enter quantity"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Add Stock</Button>
        </div>
      </form>
    </Modal>
  )
}

function MovementsModal({ isOpen, onClose, product }) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (isOpen && product?.productId) {
      setLoading(true)
      getMovements(product.productId, { page, size: 10 })
        .then((res) => {
          const d = res.data?.data || res.data
          setMovements(d?.content || d || [])
          setTotalPages(d?.totalPages ?? 1)
        })
        .catch(() => toast.error('Failed to load movements'))
        .finally(() => setLoading(false))
    }
  }, [isOpen, product, page])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Movements — ${product?.productName}`} maxWidth="max-w-2xl">
      {loading ? (
        <LoadingSpinner center />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Qty Change</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No movements found</td></tr>
                ) : movements.map((m, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <Badge variant={m.movementType === 'STOCK_IN' ? 'success' : m.movementType === 'SALE' ? 'info' : 'warning'}>
                        {m.movementType || m.type || '—'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.notes || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.createdAt || m.movementDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </Modal>
  )
}

function getStockVariant(qty, lowThreshold) {
  if (qty <= lowThreshold) return 'danger'
  if (qty - lowThreshold <= 10) return 'warning'
  return 'success'
}

function getStockLabel(stockVariant) {
  if (stockVariant === "danger") return 'Critical'
  if (stockVariant === "warning") return 'Low'
  return 'Ok'
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('product.name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [stockInTarget, setStockInTarget] = useState(null)
  const [movementsTarget, setMovementsTarget] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getInventory({ page, size: 10, sortBy, direction: sortDirection })
        const d = res.data?.data || res.data
        setItems(d?.content || d || [])
        setTotalPages(d?.totalPages ?? 1)

        try {
          const categoryRes = await getCategories()
          const categoryData = categoryRes.data?.data || categoryRes.data
          const cats = categoryData?.content || categoryData || []
          setCategories(Array.isArray(cats) ? cats : [])
        } catch {
          toast.error('Failed to load categories')
        }
      } catch {
        toast.error('Failed to load inventory')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, sortBy, sortDirection]) // Re-run when sort changes too

  const handleStockIn = async (data) => {
    setSaving(true)
    try {
      await stockIn(data)
      toast.success('Stock added successfully')
      setStockInTarget(null)
      // Reload inventory with current sort
      const res = await getInventory({ page, size: 10, sortBy, direction: sortDirection })
      const d = res.data?.data || res.data
      setItems(d?.content || d || [])
      setTotalPages(d?.totalPages ?? 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock')
    } finally {
      setSaving(false)
    }
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

  const headers = [
    <SortableHeader field="product.name">Product</SortableHeader>,
    <SortableHeader field="product.category.name">Category</SortableHeader>,
    <SortableHeader field="quantity">Current Stock</SortableHeader>,
    'Low stock Threshold',
    <SortableHeader field="status">Status</SortableHeader>,
    'Actions'
  ]

  let stockVariant;
  return (
    <Layout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={headers}
                rows={items}
                emptyMessage="No inventory data found"
                renderRow={(item) => (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{categories.find(cat=>cat.id===item?.categoryId)?.name || '—'}</td>
                    <td className="px-12 py-3 font-bold text-lg">
                      <span className={
                        (stockVariant =
                            getStockVariant(item.quantity, item.lowStockThreshold)) === 'danger' ? 'text-red-600' :
                                stockVariant === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      }>
                        {formatNumber(item.quantity)}
                      </span>
                    </td>
                    <td className="px-16 py-3 font-bold text-lg">
                      <span className={
                        (stockVariant =
                            getStockVariant(item.quantity, item.lowStockThreshold)) === 'danger' ? 'text-red-600' :
                            stockVariant === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      }>
                        {formatNumber(item.lowStockThreshold)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={stockVariant}>
                        {getStockLabel(stockVariant)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStockInTarget(item)}
                          className="px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg border border-green-200 transition-colors"
                        >
                          + Stock In
                        </button>
                        <button
                          onClick={() => setMovementsTarget(item)}
                          className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          Movements
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

      <StockInModal
        isOpen={!!stockInTarget}
        onClose={() => setStockInTarget(null)}
        onSave={handleStockIn}
        product={stockInTarget}
        loading={saving}
      />

      <MovementsModal
        isOpen={!!movementsTarget}
        onClose={() => setMovementsTarget(null)}
        product={movementsTarget}
      />
    </Layout>
  )
}
