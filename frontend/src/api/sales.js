import client from './client'

export const createInvoice = (data) => client.post('/sales/invoices', data)
export const getInvoices = (params) => client.get('/sales/invoices', { params })
export const getInvoice = (id) => client.get(`/sales/invoices/${id}`)
