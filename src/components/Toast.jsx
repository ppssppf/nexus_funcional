"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"

export const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-800",
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          progress: "bg-green-600"
        }
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-800",
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          progress: "bg-red-600"
        }
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-800",
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
          progress: "bg-amber-600"
        }
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          progress: "bg-blue-600"
        }
    }
  }

  const styles = getToastStyles()

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div
        className={`${styles.bg} ${styles.border} border-2 rounded-lg shadow-xl min-w-[320px] max-w-md overflow-hidden`}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
          <p className={`flex-1 ${styles.text} text-sm font-medium leading-relaxed`}>{message}</p>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div
              className={`h-full ${styles.progress} transition-all ease-linear`}
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// Hook personalizado para usar los toasts
export const useToast = () => {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "info", duration = 4000) => {
    setToast({ message, type, duration })
  }

  const closeToast = () => {
    setToast(null)
  }

  const ToastContainer = () => {
    if (!toast) return null
    return <Toast message={toast.message} type={toast.type} duration={toast.duration} onClose={closeToast} />
  }

  return { showToast, closeToast, ToastContainer }
}