"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Button } from "../Button"

export const ProjectsModule = ({ onShowToast }) => {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelingProjectId, setCancelingProjectId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    nombre_proyecto: "",
    descripcion: "",
    empresa: "",
    nivel_ia: "",
    fecha_inicio: "",
    fecha_fin: "",
    documentos: "",
  })
  const [userStories, setUserStories] = useState([])
  const [newStory, setNewStory] = useState("")
  const [cancelReason, setCancelReason] = useState("")

  useEffect(() => {
    loadProjects()
  }, [currentUser])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await proyectosAPI.getByLeader(currentUser.id_usuario)
      setProjects(data)
    } catch (error) {
      console.error("Error loading projects:", error)
      onShowToast("Error al cargar proyectos", "error")
    } finally {
      setLoading(false)
    }
  }

  const openModal = async (project = null) => {
    if (project) {
      if (project.estado_proyecto !== "devuelto") {
        onShowToast("Solo se pueden editar proyectos devueltos", "error")
        return
      }
      setEditingProject(project)
      setFormData({
        nombre_proyecto: project.nombre_proyecto,
        descripcion: project.descripcion,
        empresa: project.empresa,
        nivel_ia: project.nivel_ia,
        fecha_inicio: project.fecha_inicio,
        fecha_fin: project.fecha_fin,
        documentos: project.documentos || "",
      })

      // Load user stories
      const stories = await historiasAPI.getByProject(project.id_proyecto)
      setUserStories(stories.map((s) => ({ ...s, text: s.descripcion })))
    } else {
      setEditingProject(null)
      setFormData({
        nombre_proyecto: "",
        descripcion: "",
        empresa: "",
        nivel_ia: "",
        fecha_inicio: "",
        fecha_fin: "",
        documentos: "",
      })
      setUserStories([])
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setNewStory("")
  }

  const addUserStory = () => {
    if (newStory.trim()) {
      setUserStories([
        ...userStories,
        {
          id: Date.now(),
          text: newStory.trim(),
          completada: false,
          aprobada: false,
        },
      ])
      setNewStory("")
    }
  }

  const removeUserStory = (id) => {
    setUserStories(userStories.filter((s) => s.id !== id))
  }

  const calculateDuration = () => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const start = new Date(formData.fecha_inicio)
      const end = new Date(formData.fecha_fin)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const months = Math.round(diffDays / 30)
      return `${months} ${months === 1 ? "mes" : "meses"} (${diffDays} días)`
    }
    return "Seleccione las fechas para calcular la duración"
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (userStories.length === 0) {
      onShowToast("Debe agregar al menos una historia de usuario", "error")
      return
    }

    try {
      const projectData = {
        ...formData,
        id_lider: currentUser.id_usuario,
        estado_proyecto: "pendiente",
        progreso: 0,
      }

      if (editingProject) {
        // Update project
        await proyectosAPI.update(editingProject.id_proyecto, projectData)

        // Delete old stories and create new ones
        const oldStories = await historiasAPI.getByProject(editingProject.id_proyecto)
        for (const story of oldStories) {
          await historiasAPI.delete(story.id_historia)
        }

        for (const story of userStories) {
          await historiasAPI.create({
            id_proyecto: editingProject.id_proyecto,
            descripcion: story.text,
            completada: false,
            aprobada: false,
          })
        }

        onShowToast("Proyecto actualizado y enviado con éxito", "success")
      } else {
        // Create new project
        const newProjects = await proyectosAPI.create(projectData)
        const newProjectId = newProjects[0].id_proyecto

        // Create user stories
        for (const story of userStories) {
          await historiasAPI.create({
            id_proyecto: newProjectId,
            descripcion: story.text,
            completada: false,
            aprobada: false,
          })
        }

        onShowToast("Proyecto enviado con éxito, a la espera de aprobación", "success")
      }

      closeModal()
      loadProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      onShowToast("Error al guardar proyecto", "error")
    }
  }

  const openCancelModal = (projectId) => {
    const project = projects.find((p) => p.id_proyecto === projectId)

    if (project.estado_proyecto === "en-revision") {
      onShowToast("No puede cancelar un proyecto mientras está en revisión", "error")
      return
    }

    setCancelingProjectId(projectId)
    setCancelReason("")
    setShowCancelModal(true)
  }

  const confirmCancel = async (e) => {
    e.preventDefault()

    if (!cancelReason.trim()) {
      onShowToast("Debe proporcionar una justificación", "error")
      return
    }

    try {
      await proyectosAPI.update(cancelingProjectId, {
        estado_proyecto: "cancelado",
        razon_cancelacion: cancelReason,
      })

      setShowCancelModal(false)
      loadProjects()
      onShowToast("Proyecto cancelado", "info")
    } catch (error) {
      console.error("Error canceling project:", error)
      onShowToast("Error al cancelar proyecto", "error")
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: "Pendiente",
      "en-revision": "En Revisión",
      devuelto: "Devuelto",
      aprobado: "Aprobado",
      "no-aprobado": "No Aprobado",
      cancelado: "Cancelado",
      completado: "Completado",
    }
    return labels[status] || status
  }

  const getAILevelLabel = (level) => {
    const labels = {
      bajo: "Bajo",
      medio: "Medio",
      alto: "Alto",
      avanzado: "Avanzado",
    }
    return labels[level] || level
  }

  if (loading) {
    return <div className="text-center py-8">Cargando proyectos...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-4xl font-bold text-blue-600">Gestión de Proyectos</h2>
        <Button onClick={() => openModal()}>+ Nuevo Proyecto</Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <h3 className="text-2xl mb-2 text-gray-400">No hay proyectos</h3>
          <p>Crea tu primer proyecto usando el botón "Nuevo Proyecto"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id_proyecto}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{project.nombre_proyecto}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    project.estado_proyecto === "pendiente"
                      ? "bg-yellow-100 text-yellow-800"
                      : project.estado_proyecto === "aprobado"
                        ? "bg-green-100 text-green-800"
                        : project.estado_proyecto === "rechazado"
                          ? "bg-red-100 text-red-800"
                          : project.estado_proyecto === "completado"
                            ? "bg-blue-100 text-blue-800"
                            : project.estado_proyecto === "devuelto"
                              ? "bg-orange-100 text-orange-800"
                              : project.estado_proyecto === "cancelado"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-blue-200 text-blue-900"
                  }`}
                >
                  {getStatusLabel(project.estado_proyecto)}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{project.descripcion}</p>

              <div
                className={`inline-block px-3 py-2 rounded-lg text-sm font-semibold mb-4 ${
                  project.nivel_ia === "bajo"
                    ? "bg-indigo-100 text-indigo-800"
                    : project.nivel_ia === "medio"
                      ? "bg-purple-100 text-purple-800"
                      : project.nivel_ia === "alto"
                        ? "bg-fuchsia-100 text-fuchsia-800"
                        : "bg-pink-100 text-pink-800"
                }`}
              >
                IA: {getAILevelLabel(project.nivel_ia)}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4 pt-4 border-t border-gray-200">
                <div>
                  <strong>Empresa:</strong> {project.empresa}
                </div>
                <div>
                  <strong>Período:</strong> {project.fecha_inicio} → {project.fecha_fin}
                </div>
                <div>
                  <strong>Creado:</strong> {new Date(project.fecha_creacion).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2">
                {project.estado_proyecto === "devuelto" && (
                  <Button size="small" onClick={() => openModal(project)}>
                    Editar
                  </Button>
                )}
                {(project.estado_proyecto === "pendiente" || project.estado_proyecto === "aprobado") && (
                  <Button size="small" variant="danger" onClick={() => openCancelModal(project.id_proyecto)}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProject ? "Editar Proyecto" : "Nuevo Proyecto"}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Nombre del Proyecto *</label>
            <input
              type="text"
              value={formData.nombre_proyecto}
              onChange={(e) => setFormData({ ...formData, nombre_proyecto: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Descripción *</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              required
              rows="3"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Empresa *</label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Nivel de Implementación de IA *</label>
              <select
                value={formData.nivel_ia}
                onChange={(e) => setFormData({ ...formData, nivel_ia: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
              >
                <option value="">Seleccionar...</option>
                <option value="bajo">Bajo - Uso básico de herramientas IA</option>
                <option value="medio">Medio - Integración moderada de IA</option>
                <option value="alto">Alto - Implementación profunda de IA</option>
                <option value="avanzado">Avanzado - IA como componente central</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Fecha de Inicio *</label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Fecha de Fin *</label>
              <input
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Duración Estimada</label>
            <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-800 font-semibold text-center">
              {calculateDuration()}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Historias de Usuario *</label>
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newStory}
                  onChange={(e) => setNewStory(e.target.value)}
                  placeholder="Ingrese una historia de usuario"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addUserStory())}
                />
                <Button type="button" onClick={addUserStory}>
                  Agregar
                </Button>
              </div>

              {userStories.length === 0 ? (
                <p className="text-center text-gray-400 italic py-4">No hay historias de usuario agregadas</p>
              ) : (
                <ul className="space-y-2">
                  {userStories.map((story) => (
                    <li
                      key={story.id}
                      className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <span>{story.text}</span>
                      <button
                        type="button"
                        onClick={() => removeUserStory(story.id)}
                        className="bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 text-xl leading-none"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t-2 border-gray-200">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit">Guardar y Enviar a Aprobación</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Proyecto">
        <form onSubmit={confirmCancel} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 font-semibold">Justificación de Cancelación *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              rows="4"
              placeholder="Por favor explique por qué está cancelando este proyecto..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>
              Volver
            </Button>
            <Button type="submit" variant="danger">
              Confirmar Cancelación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
