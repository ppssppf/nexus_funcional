"use client"

import { LayoutGrid, CheckCircle, Activity, History, Users, ChevronRight, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

export const Navigation = ({ activeModule, onModuleChange, isManager, onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (onCollapse) onCollapse(false)
  }, [])


  const handleToggle = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    console.log('Sidebar collapsed:', newCollapsed)
    if (onCollapse) {
      onCollapse(newCollapsed)
    }
  }

  const navItems = [
    { id: "projects", label: "Gestión de Proyectos", role: "leader", icon: LayoutGrid },
    { id: "approval", label: "Aprobación", role: "manager", icon: CheckCircle },
    { id: "tracking", label: "Seguimiento", role: "both", icon: Activity },
    { id: "history", label: "Histórico", role: "both", icon: History },
    { id: "users", label: "Registro de Usuarios", role: "manager", icon: Users },
  ]

  const filteredItems = navItems.filter((item) => {
    if (item.role === "both") return true
    if (item.role === "manager") return isManager
    if (item.role === "leader") return !isManager
    return true
  })

  return (
    <nav className={`bg-gradient-to-b from-purple-900 via-purple-800 to-blue-900 h-screen fixed left-0 top-0 flex flex-col shadow-2xl transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <button
          onClick={handleToggle}
          className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            {collapsed ? (
              <ChevronRight className="w-6 h-6 text-white" />
            ) : (
              <Sparkles className="w-6 h-6 text-white" />
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-lg whitespace-nowrap">MVM NEXUS AI</h1>
              <p className="text-purple-200 text-xs whitespace-nowrap">Proyectos con IA</p>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-6 px-3">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id

            return (
              <li key={item.id}>
                <button
                  onClick={() => onModuleChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-purple-100 hover:bg-white/10 hover:text-white"
                    }`}
                  title={collapsed ? item.label : ""}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-r-full"></div>
                  )}

                  <Icon className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-white' : 'text-purple-300 group-hover:text-white'} transition-colors`} />

                  {!collapsed && (
                    <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}

                  {collapsed && (
                    <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-1 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}