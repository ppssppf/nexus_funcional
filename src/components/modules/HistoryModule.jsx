"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Filter, X, Eye, Building2, Calendar, TrendingUp, CheckCircle, Clock, XCircle, Brain } from "lucide-react"

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

      const projectsWithStories = await Promise.all(
        data.map(async (project) => {
          const stories = await historiasAPI.getByProject(project.id_proyecto)
          const approvedCount = stories.filter((s) => s.estado_historia === "aprobado").length
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
      filtered = filtered.filter((p) => 
        p.empresa && p.empresa.toLowerCase().includes(filters.company.toLowerCase())
      )
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
          Histórico de Proyectos
        </h2>
        <p className="text-gray-600">Consulta el historial completo de proyectos</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Filtros</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre de empresa..."
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="flex-1 min-w-[200px] px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en-revision">En Revisión</option>
            <option value="devuelto">Devuelto</option>
            <option value="aprobado">Aprobado</option>
            <option value="no-aprobado">No Aprobado</option>
            <option value="cancelado">Cancelado</option>
            <option value="completado">Completado</option>
          </select>
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Stats Cards - Only for managers */}
      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium opacity-90">Total Proyectos</h4>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-4xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium opacity-90">Aprobados</h4>
              <CheckCircle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-4xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium opacity-90">Pendientes</h4>
              <Clock className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-4xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium opacity-90">Rechazados</h4>
              <XCircle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-4xl font-bold">{stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No se encontraron proyectos</h3>
          <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Proyecto</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Empresa</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Nivel IA</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Estado</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Historias</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Progreso</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects.map((project) => (
                  <tr key={project.id_proyecto} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800 text-sm">{project.nombre?.toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{project.empresa?.toUpperCase() || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          project.nivel_ia === "bajo"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : project.nivel_ia === "medio"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : project.nivel_ia === "alto"
                                ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
                                : "bg-pink-50 text-pink-700 border border-pink-200"
                        }`}
                      >
                        <Brain className="w-3 h-3" />
                        {getAILevelLabel(project.nivel_ia)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          project.estado_proyecto === "pendiente"
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            : project.estado_proyecto === "aprobado"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : project.estado_proyecto === "no-aprobado"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : project.estado_proyecto === "completado"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : project.estado_proyecto === "devuelto"
                                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                                    : project.estado_proyecto === "cancelado"
                                      ? "bg-gray-100 text-gray-700 border border-gray-200"
                                      : "bg-purple-100 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {getStatusLabel(project.estado_proyecto)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {project.approvedCount}/{project.totalStories}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(project.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {project.estado_proyecto === "cancelado" && (
                        <button
                          onClick={() => viewCancelReason(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver razón
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Razón de Cancelación">
        {selectedProject && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-lg font-bold text-purple-900 mb-1">{selectedProject.nombre}</h4>
              <p className="text-sm text-purple-700">ID: {selectedProject.id_proyecto}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <strong className="text-sm text-gray-700">Fecha de Cancelación:</strong>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                {selectedProject.fecha_cancelacion
                  ? new Date(selectedProject.fecha_cancelacion).toLocaleString()
                  : "No disponible"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <strong className="block text-sm text-gray-700 mb-2">Razón de Cancelación:</strong>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedProject.razon_cancelacion || "No se proporcionó una razón"}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}