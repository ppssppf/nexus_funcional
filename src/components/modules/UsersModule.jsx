"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { usuariosAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Plus, Mail, Shield, User, Trash2, UserPlus, Eye, EyeOff } from "lucide-react"

export const UsersModule = ({ onShowToast }) => {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    rol: "",
    estado: "activo",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usuariosAPI.getAll()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      onShowToast("Error al cargar usuarios", "error")
    } finally {
      setLoading(false)
    }
  }

  const openModal = () => {
    setFormData({
      nombre: "",
      email: "",
      contraseña: "",
      rol: "",
      estado: "activo",
    })
    setShowPassword(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const existingUser = users.find((u) => u.email === formData.email)
    if (existingUser) {
      onShowToast("El email ya está registrado", "error")
      return
    }

    try {
      await usuariosAPI.create(formData)
      onShowToast(`Usuario ${formData.nombre} registrado correctamente`, "success")
      closeModal()
      loadUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      onShowToast("Error al crear usuario", "error")
    }
  }

  const deleteUser = async (userId) => {
    const user = users.find((u) => u.id_usuario === userId)

    if (userId === currentUser.id_usuario) {
      onShowToast("No puede eliminar su propio usuario", "error")
      return
    }

    if (confirm(`¿Está seguro de eliminar al usuario ${user.nombre}?`)) {
      try {
        await usuariosAPI.delete(userId)
        onShowToast("Usuario eliminado", "success")
        loadUsers()
      } catch (error) {
        console.error("Error deleting user:", error)
        onShowToast("Error al eliminar usuario", "error")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
            Registro de Usuarios
          </h2>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay usuarios registrados</h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Comienza registrando usuarios usando el botón "Nuevo Usuario"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user) => (
            <div
              key={user.id_usuario}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-3xl font-bold flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-800 text-center mb-1">{user.nombre}</h3>

                {/* Role Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                    user.rol === "gerente"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {user.rol === "gerente" ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                  {user.rol === "gerente" ? "Gerente" : "Líder de Proyecto"}
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-full">{user.email}</span>
                </div>

                {/* Status */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.estado === "activo"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {user.estado === "activo" ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteUser(user.id_usuario)}
                disabled={user.id_usuario === currentUser.id_usuario}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  user.id_usuario === currentUser.id_usuario
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Registrar Nuevo Usuario">
        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Nombre Completo *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Email *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="usuario@ejemplo.com"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Contraseña *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.contraseña}
                onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                required
                minLength="6"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <small className="block mt-1.5 text-xs text-gray-500">La contraseña debe tener al menos 6 caracteres</small>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Rol *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
              >
                <option value="">Seleccionar...</option>
                <option value="lider">Líder de Proyecto</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Estado *</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-between pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
            >
              Registrar Usuario
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}