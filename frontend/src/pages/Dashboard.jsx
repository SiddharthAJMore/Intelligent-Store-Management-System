import React, { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import Layout from '../components/layout/Layout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatCurrency, formatNumber } from '../utils/formatters'
import { getSalesSummary, getTopProducts, getLowStockReport } from '../api/reports'
import { getProductCount } from '../api/products'
import { getLowStock } from '../api/inventory'

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${color} shadow-sm p-5 flex items-start gap-4`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dailySummary, setDailySummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const mountedRef = useRef(false)

  // Load all dashboard data once on mount
  useEffect(() => {
    if (mountedRef.current) return // Already loaded
    mountedRef.current = true
    
    const loadAll = async () => {
      setLoading(true)
      try {
        const [summaryRes, topRes, lowRes, prodRes] = await Promise.allSettled([
          getSalesSummary({ period: 'daily' }),
          getTopProducts({ limit: 5, days: 30 }),
          getLowStock({ page: 0, size: 5 }),
          getProductCount(),
        ])

        if (summaryRes.status === 'fulfilled') {
          const d = summaryRes.value.data?.data || summaryRes.value.data
          setDailySummary(d)
          const breakdown = d?.breakdown || []
          setChartData(breakdown?.slice(-30) || [])
        }
        if (topRes.status === 'fulfilled') {
          const d = topRes.value.data?.data || topRes.value.data
          setTopProducts(Array.isArray(d) ? d.slice(0, 5) : [])
        }
        if (lowRes.status === 'fulfilled') {
          const d = lowRes.value.data?.data || lowRes.value.data
          const items = d?.content || d || []
          setLowStockItems(Array.isArray(items) ? items.slice(0, 5) : [])
          setLowStockCount(d?.totalElements ?? (Array.isArray(items) ? items.length : 0))
        }
        if (prodRes.status === 'fulfilled') {
          const d = prodRes.value.data?.data || prodRes.value.data
          setTotalProducts(d?.totalElements ?? 0)
        }
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, []) // Empty deps - run once on mount

  if (loading) return <Layout><LoadingSpinner center /></Layout>

  const todayRevenue = dailySummary?.totalAmount ?? 0
  const todayInvoices = dailySummary?.invoiceCount ?? 0

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon="💰"
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            color="border-green-500"
          />
          <StatCard
            icon="🧾"
            label="Today's Invoices"
            value={formatNumber(todayInvoices)}
            color="border-blue-500"
          />
          <StatCard
            icon="⚠️"
            label="Low Stock Alerts"
            value={formatNumber(lowStockCount)}
            color="border-yellow-500"
            sub="Items need restocking"
          />
          <StatCard
            icon="📦"
            label="Total Products"
            value={formatNumber(totalProducts)}
            color="border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Revenue Trend (Last 30 Days)</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 5, fill: '#16a34a' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                No revenue data available
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Top Products (30 Days)</h2>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="productName" type="category" tick={{ fontSize: 10 }} width={80} tickLine={false} />
                  <Tooltip formatter={(v) => [formatNumber(v), 'Units Sold']} />
                  <Bar dataKey="totalUnits" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                No product data available
              </div>
            )}
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span>⚠️</span> Low Stock Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Product</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Category</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">Current Stock</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-800">{item.productName}</td>
                      <td className="py-2 px-3 text-gray-500">{item.categoryName || '—'}</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        <span className={item.quantity <= 5 ? 'text-red-600' : 'text-yellow-600'}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.quantity <= 5
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.quantity <= 5 ? 'Critical' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
