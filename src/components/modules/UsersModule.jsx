"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { usuariosAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Button } from "../Button"

export const UsersModule = ({ onShowToast }) => {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    rol: "",
    estado: "activo", // Campo requerido por la base de datos
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
    return <div className="text-center py-8">Cargando usuarios...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-4xl font-bold text-blue-600">Registro de Usuarios</h2>
        <Button onClick={openModal}>+ Nuevo Usuario</Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <h3 className="text-2xl mb-2 text-gray-400">No hay usuarios</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {users.map((user) => (
            <div
              key={user.id_usuario}
              className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-blue-600 hover:shadow-lg transition-all"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4">
                {user.nombre.charAt(0).toUpperCase()}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">{user.nombre}</h3>

              <p className="text-blue-600 font-semibold text-sm mb-1">
                {user.rol === "gerente" ? "Gerente" : "Líder de Proyecto"}
              </p>

              <p className="text-gray-500 text-sm mb-4">{user.email}</p>

              <div className="mt-4">
                <Button size="small" variant="danger" onClick={() => deleteUser(user.id_usuario)} className="w-full">
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Registrar Nuevo Usuario">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Nombre Completo *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="usuario@ejemplo.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Contraseña *</label>
            <input
              type="password"
              value={formData.contraseña}
              onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
              required
              minLength="6"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            />
            <small className="block mt-2 text-gray-600">Mínimo 6 caracteres</small>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Rol *</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            >
              <option value="">Seleccionar...</option>
              <option value="lider">Líder de Proyecto</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Estado *</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t-2 border-gray-200">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Usuario</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
