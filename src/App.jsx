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

  useEffect(() => {
    if (currentUser) {
      setActiveModule(isManager ? "approval" : "projects")
    }
  }, [currentUser, isManager])

  const showToast = (message, type = "info") => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
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
      <Header />
      <Navigation activeModule={activeModule} onModuleChange={setActiveModule} isManager={isManager} />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-5">
          {activeModule === "projects" && <ProjectsModule onShowToast={showToast} />}
          {activeModule === "approval" && <ApprovalModule onShowToast={showToast} />}
          {activeModule === "tracking" && <TrackingModule onShowToast={showToast} />}
          {activeModule === "history" && <HistoryModule onShowToast={showToast} />}
          {activeModule === "users" && <UsersModule onShowToast={showToast} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  )
}

export default App
