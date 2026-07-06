import React, {createContext, useCallback, useEffect, useState} from 'react'
import {getCategories} from '../api/categories'

export const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  const loadCategories = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    if (!forceRefresh && lastFetch && now - lastFetch < CACHE_DURATION && categories.length > 0) {
      return categories
    }

    setLoading(true)
    setError(null)
    try {
      const res = await getCategories()
      const d = res.data?.data || res.data
      const cats = d?.content || d || []
      const sortedCats = Array.isArray(cats) ? cats.sort((a, b) => a.name.localeCompare(b.name)) : []
      setCategories(sortedCats)
      setLastFetch(now)
      return sortedCats
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [lastFetch, categories])

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, loadCategories }}>
      {children}
    </CategoriesContext.Provider>
  )
}
