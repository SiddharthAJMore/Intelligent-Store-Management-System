import React from 'react'

const variantClasses = {
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700'
}

export default function Badge({ variant = 'success', children }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        variantClasses[variant] || variantClasses.success
      }`}
    >
      {children}
    </span>
  )
}
