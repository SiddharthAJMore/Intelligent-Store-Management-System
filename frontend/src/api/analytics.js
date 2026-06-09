import client from './client'

export const runAnalysis = () => client.post('/analytics/run')
export const getAssociationRules = (params) =>
  client.get('/analytics/association-rules', { params })
export const getRestockSuggestions = (params) =>
  client.get('/analytics/restock-suggestions', { params })
