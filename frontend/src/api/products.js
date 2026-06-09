import client from './client'

export const getProducts = (params) => client.get('/products', { params })
export const getProduct = (id) => client.get(`/products/${id}`)
export const createProduct = (data) => client.post('/products', data)
export const updateProduct = (id, data) => client.put(`/products/${id}`, data)
export const toggleProductStatus = (id, active) => client.patch(`/products/${id}/status`, { active })
export const getProductCount = () => client.get('/products', { params: { page: 0, size: 1 } })
