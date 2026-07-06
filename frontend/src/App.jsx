import React from 'react'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {Toaster} from 'react-hot-toast'
import {AuthProvider} from './context/AuthContext'
import {useAuth} from './hooks/useAuth'
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute from './routes/RoleRoute'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import Users from './pages/Users'
import SalesHistory from './pages/SalesHistory'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'ADMIN'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/pos" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><RootRedirect /></PrivateRoute>} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Dashboard />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN', 'CASHIER']}>
              <POS />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Products />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Categories />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Inventory />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Users />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <SalesHistory />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Reports />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <RoleRoute roles={['ADMIN']}>
              <Analytics />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '8px', background: '#333', color: '#fff' },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
