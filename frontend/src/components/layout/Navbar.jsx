import React from 'react'
import {useAuth} from '../../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🛒</span>
        <span className="text-xl font-bold text-green-700">Smart Store</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              user?.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  )
}
