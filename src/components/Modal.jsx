"use client"

export const Modal = ({ isOpen, onClose, title, children, size = "default" }) => {
  if (!isOpen) return null

  const sizeClasses = {
    default: "max-w-2xl",
    large: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8 overflow-y-auto">
      <div className={`bg-white rounded-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h3 className="text-2xl font-bold text-blue-600">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
