import React from 'react'

export default function ButtonWithSpinner({ children, isLoading, disabled, className = '', onClick, type = 'button', ...props }) {
  const isDisabled = disabled || isLoading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  )
}
