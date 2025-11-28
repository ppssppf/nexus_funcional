"use client"

import { useEffect } from "react"

export const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  const bgColors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }

  return (
    <div
      className={`fixed bottom-8 right-8 ${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-xl z-50 max-w-md animate-in slide-in-from-bottom-5`}
    >
      {message}
    </div>
  )
}
