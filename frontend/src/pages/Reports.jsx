import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import { formatCurrency, formatNumber } from '../utils/formatters'
import { getSalesSummary, getTopProducts, getLowStockReport } from '../api/reports'
import {getCategories} from "../api/categories.js";

const PERIODS = ['daily', 'weekly', 'monthly']

export default function Reports() {
  const [period, setPeriod] = useState('daily')
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [topProducts, setTopProducts] = useState([])
  const [topLimit, setTopLimit] = useState(10)
  const [topDays, setTopDays] = useState(30)
  const [topLoading, setTopLoading] = useState(false)
  const [lowStock, setLowStock] = useState([])
  const [lowLoading, setLowLoading] = useState(false)

  useEffect(() => {
    const loadSummary = async () => {
      setSummaryLoading(true)
      try {
        const res = await getSalesSummary({ period })
        setSummary(res.data?.data || res.data)
      } catch {
        toast.error('Failed to load sales summary')
      } finally {
        setSummaryLoading(false)
      }
    }
    loadSummary()
  }, [period]) // Re-run when period changes

  useEffect(() => {
    setCategoriesLoading(true)
    const loadCategories = async () => {
      try {
        const categoryRes = await getCategories()
        const categoryData = categoryRes.data?.data || categoryRes.data
        const cats = categoryData?.content || categoryData || []
        setCategories(Array.isArray(cats) ? cats : [])
      } catch {
        toast.error('Failed to load categories')
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const loadTopProducts = async () => {
      setTopLoading(true)
      try {
        const res = await getTopProducts({ limit: topLimit, days: topDays })
        const d = res.data?.data || res.data
        setTopProducts(Array.isArray(d) ? d : [])
      } catch {
        toast.error('Failed to load top products')
      } finally {
        setTopLoading(false)
      }
    }
    loadTopProducts()
  }, [topLimit, topDays]) // Re-run when these change

  useEffect(() => {
    const loadLowStock = async () => {
      setLowLoading(true)
      try {
        const res = await getLowStockReport({ page: 0, size: 20 })
        const d = res.data?.data || res.data
        setLowStock(d?.content || d || [])
      } catch {
        toast.error('Failed to load low stock report')
      } finally {
        setLowLoading(false)
      }
    }
    loadLowStock()
  }, []) // Run once on mount

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>

        {/* Period Selector */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-100 p-4 flex items-center gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  period === p
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {summaryLoading ? (
            <LoadingSpinner center />
          ) : summary ? (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-gray-500">Invoice Count</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(summary.invoiceCount)}</p>
                </div>
              </div>

              {summary.breakdown && summary.breakdown.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Breakdown</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Period</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Revenue</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Invoices</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.breakdown.map((row, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-4 py-3 text-gray-700 font-medium">{row.label}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(row.revenue)}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.invoiceCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">No summary data available</div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-700">Top Products</h2>
            <div className="flex items-center gap-2">
              <select
                value={topLimit}
                onChange={(e) => setTopLimit(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {[5, 10, 20].map((v) => <option key={v} value={v}>Top {v}</option>)}
              </select>
              <select
                value={topDays}
                onChange={(e) => setTopDays(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {[7, 30, 90].map((v) => <option key={v} value={v}>Last {v} days</option>)}
              </select>
            </div>
          </div>

          {topLoading && categoriesLoading ? (
            <LoadingSpinner center />
          ) : topProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Units Sold</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-200 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.productName}</td>
                      <td className="px-4 py-3 text-gray-500">{categories.find(cat => cat.id === p?.categoryId)?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatNumber(p.totalUnits)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">No product data available</p>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            ⚠️ Low Stock Report
          </h2>
          {lowLoading && categoriesLoading ? (
            <LoadingSpinner center />
          ) : lowStock.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Current Stock</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">Low Stock Threshold</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-3 text-gray-500">{categories.find(cat => cat.id === item?.categoryId)?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={item.currentStock <= 5 ? 'text-red-600' : 'text-yellow-600'}>
                          {item.currentStock ?? item.quantity ?? 0}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        <span
                            className={item.lowStockThreshold - item.quantity >= 5 ? 'text-red-600' : 'text-yellow-600'}>
                          {item.lowStockThreshold}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.lowStockThreshold - item.quantity >= 5 || item.lowStockThreshold - item.quantity > 0
                            ? 'danger' : 'warning'}>
                          {item.lowStockThreshold - item.quantity >= 5
                            || item.lowStockThreshold - item.quantity > 0 ? 'Critical' : 'Low'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl">✅</span>
              <p className="mt-2 text-sm">All products are well stocked</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
