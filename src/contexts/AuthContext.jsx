"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { usuariosAPI } from "../lib/api"

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session storage for user
    const sessionUser = sessionStorage.getItem("mvmNexusCurrentUser")
    if (sessionUser) {
      setCurrentUser(JSON.parse(sessionUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, contraseña) => {
    try {
      const user = await usuariosAPI.login(email, contraseña)

      if (user) {
        setCurrentUser(user)
        sessionStorage.setItem("mvmNexusCurrentUser", JSON.stringify(user))
        return { success: true, user }
      } else {
        return { success: false, error: "Email o contraseña incorrectos" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Error al iniciar sesión" }
    }
  }

  const logout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem("mvmNexusCurrentUser")
  }

  const value = {
    currentUser,
    login,
    logout,
    loading,
    isManager: currentUser?.rol === "gerente",
    isLeader: currentUser?.rol === "lider",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
