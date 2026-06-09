import React from 'react'

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 rounded-lg border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
        `}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
