"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Button } from "../Button"

export const HistoryModule = ({ onShowToast }) => {
  const { currentUser, isManager } = useAuth()
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    leader: "",
    company: "",
    status: "",
  })
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [currentUser, isManager])

  useEffect(() => {
    applyFilters()
  }, [projects, filters])

  const loadProjects = async () => {
    try {
      setLoading(true)
      let data

      if (isManager) {
        data = await proyectosAPI.getAll()
      } else {
        data = await proyectosAPI.getByLeader(currentUser.id_usuario)
      }

      // Load user stories for each project to calculate progress
      const projectsWithStories = await Promise.all(
        data.map(async (project) => {
          const stories = await historiasAPI.getByProject(project.id_proyecto)
          const approvedCount = stories.filter((s) => s.aprobada).length
          const totalStories = stories.length
          const progress = totalStories > 0 ? Math.round((approvedCount / totalStories) * 100) : 0

          return {
            ...project,
            totalStories,
            approvedCount,
            progress,
          }
        }),
      )

      setProjects(projectsWithStories)
    } catch (error) {
      console.error("Error loading projects:", error)
      onShowToast("Error al cargar proyectos", "error")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...projects]

    if (filters.company) {
      filtered = filtered.filter((p) => p.empresa.toLowerCase().includes(filters.company.toLowerCase()))
    }

    if (filters.status) {
      filtered = filtered.filter((p) => p.estado_proyecto === filters.status)
    }

    setFilteredProjects(filtered)
  }

  const clearFilters = () => {
    setFilters({ leader: "", company: "", status: "" })
  }

  const viewCancelReason = (project) => {
    setSelectedProject(project)
    setShowCancelModal(true)
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

  const getStats = () => {
    return {
      total: projects.length,
      approved: projects.filter((p) => p.estado_proyecto === "aprobado" || p.estado_proyecto === "completado").length,
      pending: projects.filter((p) => p.estado_proyecto === "pendiente" || p.estado_proyecto === "en-revision").length,
      rejected: projects.filter((p) => p.estado_proyecto === "no-aprobado").length,
    }
  }

  const stats = getStats()

  if (loading) {
    return <div className="text-center py-8">Cargando histórico...</div>
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-4xl font-bold text-blue-600 mb-4">Histórico de Proyectos</h2>

        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Filtrar por empresa..."
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en-revision">En Revisión</option>
            <option value="devuelto">Devuelto</option>
            <option value="aprobado">Aprobado</option>
            <option value="no-aprobado">No Aprobado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <Button variant="secondary" onClick={clearFilters}>
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {isManager && (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-xl text-center">
            <h4 className="text-sm opacity-90 mb-2">Total Proyectos</h4>
            <p className="text-5xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-xl text-center">
            <h4 className="text-sm opacity-90 mb-2">Aprobados</h4>
            <p className="text-5xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-xl text-center">
            <h4 className="text-sm opacity-90 mb-2">Pendientes</h4>
            <p className="text-5xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-xl text-center">
            <h4 className="text-sm opacity-90 mb-2">No Aprobados</h4>
            <p className="text-5xl font-bold">{stats.rejected}</p>
          </div>
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <h3 className="text-2xl mb-2 text-gray-400">No se encontraron proyectos</h3>
          <p>Intente ajustar los filtros</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">Proyecto</th>
                <th className="px-4 py-4 text-left font-semibold">Empresa</th>
                <th className="px-4 py-4 text-left font-semibold">Nivel IA</th>
                <th className="px-4 py-4 text-left font-semibold">Estado</th>
                <th className="px-4 py-4 text-left font-semibold">Historias</th>
                <th className="px-4 py-4 text-left font-semibold">Progreso</th>
                <th className="px-4 py-4 text-left font-semibold">Fecha</th>
                <th className="px-4 py-4 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr
                  key={project.id_proyecto}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index === filteredProjects.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <strong className="text-gray-800">{project.nombre_proyecto}</strong>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{project.empresa}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        project.nivel_ia === "bajo"
                          ? "bg-indigo-100 text-indigo-800"
                          : project.nivel_ia === "medio"
                            ? "bg-purple-100 text-purple-800"
                            : project.nivel_ia === "alto"
                              ? "bg-fuchsia-100 text-fuchsia-800"
                              : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {getAILevelLabel(project.nivel_ia)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.estado_proyecto === "pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : project.estado_proyecto === "aprobado"
                            ? "bg-green-100 text-green-800"
                            : project.estado_proyecto === "no-aprobado"
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
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {project.approvedCount}/{project.totalStories}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{project.progress}%</td>
                  <td className="px-4 py-4 text-gray-600">{new Date(project.fecha_creacion).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    {project.estado_proyecto === "cancelado" && (
                      <button
                        onClick={() => viewCancelReason(project)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        👁️ Ver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Reason Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Razón de Cancelación">
        {selectedProject && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-xl font-bold text-blue-600 mb-4">{selectedProject.nombre_proyecto}</h4>

            <div className="mb-4">
              <strong className="block text-gray-700 mb-2">Fecha de Cancelación:</strong>
              <p className="text-gray-600">
                {selectedProject.fecha_cancelacion
                  ? new Date(selectedProject.fecha_cancelacion).toLocaleString()
                  : "No disponible"}
              </p>
            </div>

            <div>
              <strong className="block text-gray-700 mb-2">Razón de Cancelación:</strong>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedProject.razon_cancelacion || "No se proporcionó una razón"}
              </p>
            </div>

            <div className="mt-6 text-right">
              <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
