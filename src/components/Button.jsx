"use client"

export const Button = ({
  children,
  variant = "primary",
  size = "default",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center gap-2 font-semibold rounded-lg transition-all cursor-pointer border-none"

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:-translate-y-0.5 hover:shadow-lg",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
  }

  const sizes = {
    small: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-base",
    full: "w-full px-6 py-4 text-lg",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  )
}
