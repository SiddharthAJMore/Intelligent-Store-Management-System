import React, {createContext, useCallback, useEffect, useState} from 'react'
import * as authApi from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('grocery_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('grocery_token') || null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('grocery_token', token)
    } else {
      localStorage.removeItem('grocery_token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('grocery_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('grocery_user')
    }
  }, [user])

  const login = useCallback(async (username, password) => {
    const res = await authApi.login({ username, password })
    const data = res.data?.data || res.data
    const { token: newToken, userId, role } = data
    setToken(newToken)
    setUser({ userId, username: data.username || username, role })
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
