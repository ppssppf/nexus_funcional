"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./contexts/AuthContext"
import { LoginScreen } from "./components/LoginScreen"
import { Header } from "./components/Header"
import { Navigation } from "./components/Navigation"
import { Toast } from "./components/Toast"
import { ProjectsModule } from "./components/modules/ProjectsModule"
import { ApprovalModule } from "./components/modules/ApprovalModule"
import { TrackingModule } from "./components/modules/TrackingModule"
import { HistoryModule } from "./components/modules/HistoryModule"
import { UsersModule } from "./components/modules/UsersModule"

function App() {
  const { currentUser, loading, isManager } = useAuth()
  const [activeModule, setActiveModule] = useState("")
  const [toast, setToast] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Menu expandido por defecto

  useEffect(() => {
    if (currentUser) {
      setActiveModule(isManager ? "approval" : "projects")
    }
  }, [currentUser, isManager])

  useEffect(() => {
    const handler = (e) => {
      const { module, projectId, target, historyId } = e.detail || {}
      if (module) {
        if (projectId) {
          sessionStorage.setItem("nexusNavigateProjectId", String(projectId))
        }
        if (historyId) {
          sessionStorage.setItem("nexusNavigateHistoryId", String(historyId))
        }
        if (target) {
          sessionStorage.setItem("nexusNavigateTarget", String(target))
        }
        setActiveModule(module)
      }
    }
    window.addEventListener("nexus:navigate", handler)
    return () => window.removeEventListener("nexus:navigate", handler)
  }, [])

  const showToast = (message, type = "info") => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginScreen onShowToast={showToast} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation - Fixed */}
      <Navigation 
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
        isManager={isManager}
        onCollapse={handleSidebarCollapse}
      />

      {/* Main Content Area - Con margen dinámico para el sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header />
        
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            {activeModule === "projects" && <ProjectsModule onShowToast={showToast} />}
            {activeModule === "approval" && <ApprovalModule onShowToast={showToast} />}
            {activeModule === "tracking" && <TrackingModule onShowToast={showToast} />}
            {activeModule === "history" && <HistoryModule onShowToast={showToast} />}
            {activeModule === "users" && <UsersModule onShowToast={showToast} />}
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  )
}

export default App
