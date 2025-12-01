"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from "lucide-react"

export const LoginScreen = ({ onShowToast }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ email: "", password: "" })
  const { login } = useAuth()

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: "Ingresa un email válido" }))
    } else {
      setErrors(prev => ({ ...prev, email: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setErrors({ email: "", password: "" })
    
    // Validar email antes de enviar
    if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: "Ingresa un email válido" }))
      return
    }

    setLoading(true)

    const result = await login(email, password)

    setLoading(false)

    if (result.success) {
      onShowToast(`Bienvenido, ${result.user.nombre}`, "success")
    } else {
      onShowToast("Credenciales inválidas. Por favor verifica tu email y contraseña.", "error")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Card principal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Barra decorativa superior */}
        <div className="h-1.5 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600"></div>
        
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-3 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
              MVM NEXUS AI
            </h1>
            <p className="text-gray-500 text-xs">
              Gestión de Proyectos con Inteligencia Artificial
            </p>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Campo Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  autoComplete="email"
                  placeholder="Ingresa tu correo electrónico"
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                    errors.email 
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100" 
                      : "border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  }`}
                />
              </div>
              {errors.email && (
                <div className="mt-2 flex items-start gap-1.5 text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{errors.email}</p>
                </div>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 border-2 border-gray-200 rounded-lg transition-all duration-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Enlace "Olvidé mi contraseña" */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}