import client from './client'

export const getUsers = (params) => client.get('/users', { params })
export const createUser = (data) => client.post('/users', data)
export const updateUser = (id, data) => client.put(`/users/${id}`, data)
export const toggleUserStatus = (id, active) => client.patch(`/users/${id}/status`, { active })
