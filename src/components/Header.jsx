"use client"

import { useAuth } from "../contexts/AuthContext"

export const Header = () => {
  const { currentUser, logout, isManager } = useAuth()

  return (
    <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-6 shadow-lg">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-wide">MVM NEXUS AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-base">
              <strong>{currentUser?.nombre}</strong> <span>({isManager ? "Gerente" : "Líder de Proyecto"})</span>
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-sm font-semibold hover:bg-white/30 transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
