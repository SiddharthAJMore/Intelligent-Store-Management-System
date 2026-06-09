import client from './client'

export const getInventory = (params) => client.get('/inventory', { params })
export const getInventoryItem = (productId) => client.get(`/inventory/${productId}`)
export const stockIn = (data) => client.post('/inventory/stock-in', data)
export const getLowStock = (params) => client.get('/inventory/low-stock', { params })
export const getMovements = (productId, params) =>
  client.get(`/inventory/movements/${productId}`, { params })
