import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatCurrency } from '../utils/formatters'
import { getProducts } from '../api/products'
import { getCategories } from '../api/categories'
import { getInventory } from '../api/inventory'
import { createInvoice } from '../api/sales'

function getStockInfo(inventory, productId) {
  if (!inventory) return { qty: null, badge: 'gray', label: 'Unknown' }
  const item = inventory[productId]
  if (!item) return { qty: 0, badge: 'danger', label: 'Out of Stock' }
  if (item.quantity <= 0) return { qty: 0, badge: 'danger', label: 'Out of Stock' }
  if (item.quantity <= 10) return { qty: item.quantity, badge: 'warning', label: 'Low Stock' }
  return { qty: item.quantity, badge: 'success', label: 'In Stock' }
}

export default function POS() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [inventory, setInventory] = useState({})
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [successModal, setSuccessModal] = useState(null)
  const debounceRef = useRef(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  // Load all data once on mount
  useEffect(() => {
    if (mountedRef.current) return // Already loaded
    mountedRef.current = true
    
    const loadAll = async () => {
      try {
        // Load categories and inventory in parallel
        const [catRes, invRes] = await Promise.all([
          getCategories(),
          getInventory({ page: 0, size: 1000 })
        ])
        
        // Process categories
        const catData = catRes.data?.data || catRes.data
        const cats = catData?.content || catData || []
        setCategories(Array.isArray(cats) ? cats : [])
        
        // Process inventory
        const invData = invRes.data?.data || invRes.data
        const items = invData?.content || invData || []
        const map = {}
        items.forEach((inv) => {
          if (inv.productId) map[inv.productId] = inv
        })
        setInventory(map)
      } catch (err) {
        console.error('Failed to load initial data:', err)
      }
    }
    
    loadAll()
  }, []) // Empty deps - run once on mount

  // Load products when search or category changes
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const params = {
          active: true,
          page: 0,
          size: 100,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(selectedCategory && { category: selectedCategory }),
        }
        const res = await getProducts(params)
        const d = res.data?.data || res.data
        setProducts(d?.content || d || [])
      } catch {
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    
    loadProducts()
  }, [debouncedSearch, selectedCategory]) // Only re-run when these change

  const addToCart = (product) => {
    const stock = getStockInfo(inventory, product.id)
    if (stock.qty <= 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= stock.qty) {
          toast.error(`Only ${stock.qty} in stock`)
          return prev
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          quantity: 1,
        },
      ]
    })
  }

  const updateQty = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.productId !== productId) return i
          const stock = getStockInfo(inventory, productId)
          const newQty = i.quantity + delta
          if (newQty <= 0) return null
          if (stock.qty !== null && newQty > stock.qty) {
            toast.error(`Only ${stock.qty} in stock`)
            return i
          }
          return { ...i, quantity: newQty }
        })
        .filter(Boolean)
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const completeSale = async () => {
    if (cart.length === 0) return
    setCompleting(true)
    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }
      const res = await createInvoice(payload)
      const invoice = res.data?.data || res.data
      setSuccessModal({
        invoiceNumber: invoice?.invoiceNumber || invoice?.id || 'N/A',
        total: invoice?.totalAmount ?? cartTotal,
      })
      setCart([])
      // Reload inventory after sale
      const invRes = await getInventory({ page: 0, size: 1000 })
      const invData = invRes.data?.data || invRes.data
      const items = invData?.content || invData || []
      const map = {}
      items.forEach((inv) => {
        if (inv.productId) map[inv.productId] = inv
      })
      setInventory(map)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete sale'
      toast.error(msg)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <Layout>
      <div className="flex gap-5 h-full" style={{ minHeight: 'calc(100vh - 112px)' }}>
        {/* Left: Product Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner center />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <span className="text-5xl mb-3">📦</span>
                  <p className="text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.map((product) => {
                    const stock = getStockInfo(inventory, product.id)
                    const outOfStock = stock.qty <= 0
                    const inCart = cart.find((i) => i.productId === product.id)
                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl border p-4 transition-all ${
                          outOfStock
                            ? 'opacity-60 cursor-not-allowed border-gray-200'
                            : 'border-gray-200 hover:border-green-400 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{product.categoryName || '—'}</p>
                          </div>
                          <Badge
                            variant={stock.badge === 'danger' ? 'danger' : stock.badge === 'warning' ? 'warning' : 'success'}
                          >
                            {stock.qty !== null ? stock.qty : '?'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <p className="text-green-700 font-bold text-base">
                              {formatCurrency(product.price)}
                            </p>
                            <p className="text-xs text-gray-400">per {product.unit || 'unit'}</p>
                          </div>
                          {inCart ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-semibold">
                              In cart ({inCart.quantity})
                            </span>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              disabled={outOfStock}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                        {inCart && (
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateQty(product.id, -1)}
                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center transition-colors"
                            >
                              −
                            </button>
                            <span className="text-sm font-semibold w-6 text-center">{inCart.quantity}</span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-600 font-bold text-sm flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              🛒 Cart
              {cart.length > 0 && (
                <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                <span className="text-5xl mb-3">🛒</span>
                <p className="text-sm text-gray-400">Cart is empty</p>
                <p className="text-xs text-gray-300 mt-1">Add products from the left</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} / {item.unit || 'unit'}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-6 h-6 rounded-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-700 font-bold text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold text-green-700">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-xl text-green-700">{formatCurrency(cartTotal)}</span>
            </div>
            <Button
              onClick={completeSale}
              disabled={cart.length === 0}
              loading={completing}
              size="lg"
              className="w-full"
            >
              ✓ Complete Sale
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={!!successModal}
        onClose={() => setSuccessModal(null)}
        title="✅ Sale Completed!"
      >
        <div className="text-center space-y-4 py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Invoice Number</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">#{successModal?.invoiceNumber}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(successModal?.total)}</p>
          </div>
          <Button onClick={() => setSuccessModal(null)} className="w-full" size="lg">
            New Sale
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
