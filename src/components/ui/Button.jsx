import React from "react";

const variantClasses = {
  default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
  outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  return (
    <button
      className={`rounded-md font-semibold transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;













