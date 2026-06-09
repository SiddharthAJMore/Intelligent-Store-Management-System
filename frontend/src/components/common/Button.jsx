import React from 'react'
import LoadingSpinner from './LoadingSpinner'

const variantClasses = {
  primary: 'bg-green-600 hover:bg-green-700 text-white border-transparent',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg border
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}
