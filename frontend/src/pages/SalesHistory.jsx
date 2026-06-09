import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getInvoices, getInvoice } from '../api/sales'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function SalesHistory() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [fromDate, setFromDate] = useState(today())
  const [toDate, setToDate] = useState(today())
  const [viewInvoice, setViewInvoice] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = { page, size: 10 }
        if (fromDate) params.from = fromDate
        if (toDate) params.to = toDate
        const res = await getInvoices(params)
        const d = res.data?.data || res.data
        setInvoices(d?.content || d || [])
        setTotalPages(d?.totalPages ?? 1)
      } catch {
        toast.error('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, fromDate, toDate]) // Re-run when these change

  const handleView = async (id) => {
    setViewLoading(true)
    try {
      const res = await getInvoice(id)
      setViewInvoice(res.data?.data || res.data)
    } catch {
      toast.error('Failed to load invoice details')
    } finally {
      setViewLoading(false)
    }
  }

  const headers = ['Invoice #', 'Cashier', 'Total', 'Date & Time', 'Actions']

  return (
    <Layout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <Button onClick={() => { setPage(0); /* Reload will trigger via useEffect */ }} variant="outline">
            🔍 Filter
          </Button>
          <Button
            onClick={() => { setFromDate(today()); setToDate(today()); setPage(0) }}
            variant="secondary"
            size="sm"
          >
            Reset
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <LoadingSpinner center />
          ) : (
            <>
              <Table
                headers={headers}
                rows={invoices}
                emptyMessage="No invoices found for the selected period"
                renderRow={(inv) => (
                  <>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                      #{inv.invoiceNumber || inv.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.cashierName || inv.createdBy || '—'}</td>
                    <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleView(inv.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                      >
                        View
                      </button>
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

      <Modal
        isOpen={!!viewInvoice || viewLoading}
        onClose={() => setViewInvoice(null)}
        title="Invoice Details"
        maxWidth="max-w-2xl"
      >
        {viewLoading ? (
          <LoadingSpinner center />
        ) : viewInvoice ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Invoice Number</p>
                <p className="font-bold text-gray-800">#{viewInvoice.invoiceNumber || viewInvoice.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cashier</p>
                <p className="font-medium text-gray-800">{viewInvoice.cashierName || viewInvoice.createdBy || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="font-medium text-gray-800">{formatDate(viewInvoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-xl text-green-700">{formatCurrency(viewInvoice.totalAmount)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Line Items</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Product</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Qty</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewInvoice.items || viewInvoice.lineItems || []).map((item, i) => (
                      <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-3 py-2.5 text-gray-800">{item.productName || item.name}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice || item.price)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-green-700">
                          {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-gray-800">Grand Total</td>
                      <td className="px-3 py-2.5 text-right font-bold text-green-700 text-base">
                        {formatCurrency(viewInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <Button onClick={() => setViewInvoice(null)} variant="secondary" className="w-full">Close</Button>
          </div>
        ) : null}
      </Modal>
    </Layout>
  )
}
