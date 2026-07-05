import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatNumber, formatDate } from '../utils/formatters'
import { runAnalysis, getAssociationRules, getRestockSuggestions } from '../api/analytics'

export default function Analytics() {
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState(null)

  const [rules, setRules] = useState([])
  const [rulesPage, setRulesPage] = useState(0)
  const [rulesTotalPages, setRulesTotalPages] = useState(0)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesSortBy, setRulesSortBy] = useState('coOccurrenceCount')
  const [rulesSortDirection, setRulesSortDirection] = useState('desc')

  const [restock, setRestock] = useState([])
  const [restockPage, setRestockPage] = useState(0)
  const [restockTotalPages, setRestockTotalPages] = useState(0)
  const [restockLoading, setRestockLoading] = useState(false)
  const [restockSortBy, setRestockSortBy] = useState('daysUntilStockout')
  const [restockSortDirection, setRestockSortDirection] = useState('asc')

  useEffect(() => {
    const loadRules = async () => {
      setRulesLoading(true)
      try {
        const res = await getAssociationRules({ page: rulesPage, size: 20, sortBy: rulesSortBy, direction: rulesSortDirection })
        const d = res.data?.data || res.data
        const items = d?.content || d || []
        setRules(Array.isArray(items) ? items : [])
        setRulesTotalPages(d?.totalPages ?? 1)
        if (items.length > 0 && items[0].computedAt) {
          setLastRun(items[0].computedAt)
        }
      } catch {
        toast.error('Failed to load association rules')
      } finally {
        setRulesLoading(false)
      }
    }
    loadRules()
  }, [rulesPage, rulesSortBy, rulesSortDirection])

  useEffect(() => {
    const loadRestock = async () => {
      setRestockLoading(true)
      try {
        const res = await getRestockSuggestions({ page: restockPage, size: 20, sortBy: restockSortBy, direction: restockSortDirection })
        const d = res.data?.data || res.data
        const items = d?.content || d || []
        setRestock(Array.isArray(items) ? items : [])
        setRestockTotalPages(d?.totalPages ?? 1)
        if (items.length > 0 && items[0].computedAt && !lastRun) {
          setLastRun(items[0].computedAt)
        }
      } catch {
        toast.error('Failed to load restock suggestions')
      } finally {
        setRestockLoading(false)
      }
    }
    loadRestock()
  }, [restockPage, restockSortBy, restockSortDirection, lastRun])

  const handleRunAnalysis = async () => {
    setRunning(true)
    try {
      await runAnalysis()
      toast.success('Analysis completed successfully!')
      setLastRun(new Date().toISOString())
      setRulesPage(0)
      setRestockPage(0)
      // Reload both
      const [rulesRes, restockRes] = await Promise.all([
        getAssociationRules({ page: 0, size: 20, sortBy: rulesSortBy, direction: rulesSortDirection }),
        getRestockSuggestions({ page: 0, size: 20, sortBy: restockSortBy, direction: restockSortDirection })
      ])
      const rulesData = rulesRes.data?.data || rulesRes.data
      const rulesItems = rulesData?.content || rulesData || []
      setRules(Array.isArray(rulesItems) ? rulesItems : [])
      setRulesTotalPages(rulesData?.totalPages ?? 1)
      
      const restockData = restockRes.data?.data || restockRes.data
      const restockItems = restockData?.content || restockData || []
      setRestock(Array.isArray(restockItems) ? restockItems : [])
      setRestockTotalPages(restockData?.totalPages ?? 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run analysis')
    } finally {
      setRunning(false)
    }
  }

  const handleRulesSort = (field) => {
    if (rulesSortBy === field) {
      setRulesSortDirection(rulesSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setRulesSortBy(field)
      setRulesSortDirection('asc')
    }
    setRulesPage(0)
  }

  const handleRestockSort = (field) => {
    if (restockSortBy === field) {
      setRestockSortDirection(restockSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setRestockSortBy(field)
      setRestockSortDirection('asc')
    }
    setRestockPage(0)
  }

  const SortableHeader = ({ children, field, sortBy, sortDirection }) => {
    const isActive = sortBy === field
    return (
      <button
        onClick={() => {
          if (field === 'coOccurrenceCount' || field === 'support' || field === 'confidence') {
            handleRulesSort(field)
          } else {
            handleRestockSort(field)
          }
        }}
        className="flex items-center gap-1.5 hover:text-green-700 font-medium transition-colors"
      >
        {children}
        <span className="text-xs">
          {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    )
  }

  const rulesHeaders = [
    'Product A',
    'Product B',
    <SortableHeader field="coOccurrenceCount" sortBy={rulesSortBy} sortDirection={rulesSortDirection}>Co-Occurrences</SortableHeader>,
    <SortableHeader field="support" sortBy={rulesSortBy} sortDirection={rulesSortDirection}>Support %</SortableHeader>,
    <SortableHeader field="confidence" sortBy={rulesSortBy} sortDirection={rulesSortDirection}>Confidence %</SortableHeader>
  ]
  const restockHeaders = [
    'Product',
    <SortableHeader field="currentStock" sortBy={restockSortBy} sortDirection={restockSortDirection}>Current Stock</SortableHeader>,
    <SortableHeader field="avgDailySales" sortBy={restockSortBy} sortDirection={restockSortDirection}>Avg Daily Sales</SortableHeader>,
    <SortableHeader field="daysUntilStockout" sortBy={restockSortBy} sortDirection={restockSortDirection}>Days Until Stockout</SortableHeader>,
    <SortableHeader field="suggestedRestockQty" sortBy={restockSortBy} sortDirection={restockSortDirection}>Suggested Qty</SortableHeader>
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
            {lastRun && (
              <p className="text-xs text-gray-400 mt-0.5">Last run: {formatDate(lastRun)}</p>
            )}
          </div>
          <Button onClick={handleRunAnalysis} loading={running} size="lg">
            🔬 Run Analysis
          </Button>
        </div>

        {/* Association Rules */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-700">Association Rules</h2>
            <p className="text-xs text-gray-400 mt-0.5">Products frequently bought together</p>
          </div>

          {rulesLoading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={rulesHeaders}
                rows={rules}
                emptyMessage="No association rules found. Run analysis to generate them."
                renderRow={(rule) => (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{rule.productAName}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{rule.productBName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {formatNumber(rule.coOccurrenceCount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (rule.support || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-14 text-right">
                          {((rule.support || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (rule.confidence || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-14 text-right">
                          {((rule.confidence || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </>
                )}
              />
              <Pagination currentPage={rulesPage} totalPages={rulesTotalPages} onPageChange={setRulesPage} />
            </>
          )}
        </div>

        {/* Restock Suggestions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-700">Restock Suggestions</h2>
          </div>

          {restockLoading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={restockHeaders}
                rows={restock}
                emptyMessage="No restock suggestions found. Run analysis to generate them."
                renderRow={(item) => {
                  const daysUntil = item.daysUntilStockout ?? null
                  const urgentVariant = daysUntil !== null && daysUntil <= 3
                    ? 'danger'
                    : daysUntil !== null && daysUntil <= 7
                    ? 'warning'
                    : 'success'
                  return (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${item.currentStock <= 5 ? 'text-red-600' : item.currentStock <= 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatNumber(item.currentStock)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatNumber(item.avgDailySales)}</td>
                      <td className="px-4 py-3">
                        {daysUntil !== null ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            urgentVariant === 'danger' ? 'bg-red-100 text-red-700' :
                            urgentVariant === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {daysUntil} days
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          +{formatNumber(item.suggestedRestockQty)}
                        </span>
                      </td>
                    </>
                  )
                }}
              />
              <Pagination currentPage={restockPage} totalPages={restockTotalPages} onPageChange={setRestockPage} />
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
