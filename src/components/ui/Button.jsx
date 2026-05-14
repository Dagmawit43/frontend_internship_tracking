import React from "react";

const variantClasses = {
  default:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-700/15",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-700/10",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 " +
  "disabled:pointer-events-none disabled:opacity-50";

export const Button = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
