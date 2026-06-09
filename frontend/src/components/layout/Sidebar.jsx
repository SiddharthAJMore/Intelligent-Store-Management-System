import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/pos', label: 'POS', icon: '🛒' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
  { to: '/inventory', label: 'Inventory', icon: '🏪' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/sales', label: 'Sales History', icon: '🧾' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/analytics', label: 'Analytics', icon: '🔬' },
]

const cashierLinks = [
  { to: '/pos', label: 'POS', icon: '🛒' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const links = user?.role === 'ADMIN' ? adminLinks : cashierLinks

  return (
    <aside className="w-60 bg-gray-800 text-white flex flex-col flex-shrink-0 min-h-screen">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <div>
            <p className="font-bold text-white text-sm">Smart Grocery</p>
            <p className="text-gray-400 text-xs">Management System</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
