import client from './client'

export const getSalesSummary = (params) => client.get('/reports/sales-summary', { params })
export const getTopProducts = (params) => client.get('/reports/top-products', { params })
export const getLowStockReport = (params) => client.get('/reports/low-stock', { params })
