import React from 'react'

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md', center = false }) {
  const spinner = (
    <div
      className={`${sizeMap[size] || sizeMap.md} border-gray-200 border-t-green-600 rounded-full animate-spin`}
    />
  )

  if (center) {
    return (
      <div className="flex items-center justify-center w-full py-12">
        {spinner}
      </div>
    )
  }

  return spinner
}
