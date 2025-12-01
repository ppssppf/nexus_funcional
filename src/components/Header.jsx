"use client"

import { useAuth } from "../contexts/AuthContext"
import { LogOut, User, Shield } from "lucide-react"

export const Header = () => {
  const { currentUser, logout, isManager } = useAuth()

  return (
    <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 border-b border-white/10 shadow-lg sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Título - Ya no es necesario porque está en el sidebar */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {currentUser?.nombre
                  ?.toLowerCase()
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </h2>
            </div>
          </div>

          {/* User Info y Logout */}
          <div className="flex items-center gap-4">
            {/* Badge de rol */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
              {isManager ? (
                <Shield className="w-4 h-4 text-purple-300" />
              ) : (
                <User className="w-4 h-4 text-blue-300" />
              )}
              <span className="text-sm font-medium text-white">
                {isManager ? "Gerente" : "Líder de Proyecto"}
              </span>
            </div>

            {/* Botón de Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-purple-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}