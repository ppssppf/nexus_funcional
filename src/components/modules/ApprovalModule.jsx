"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI, aprobacionesAPI } from "../../lib/api"
import { Modal } from "../Modal"
import {
  Calendar,
  Building2,
  Brain,
  Eye,
  Sparkles,
  Clock,
  CheckCircle2,
  RotateCcw,
  XCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  SparklesIcon,
} from "lucide-react"

export const ApprovalModule = ({ onShowToast }) => {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [incentive, setIncentive] = useState("")
  const [returnReason, setReturnReason] = useState("")
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    if (currentUser?.id_usuario) {
      loadPendingProjects()
    }
  }, [currentUser])

  const loadPendingProjects = async () => {
    try {
      setLoading(true)
      const data = await proyectosAPI.getAll()
      const pending = data.filter((p) => {
        return p.estado_proyecto === "pendiente" || p.estado_proyecto === "en-revision"
      })
      setProjects(pending)
    } catch (error) {
      console.error("Error loading projects:", error)
      onShowToast("Error al cargar proyectos", "error")
    } finally {
      setLoading(false)
    }
  }

  const openModal = async (project) => {
    setSelectedProject(project)

    if (project.estado_proyecto === "pendiente") {
      await proyectosAPI.update(project.id_proyecto, {
        estado_proyecto: "en-revision",
      })
      loadPendingProjects()
    }

    const stories = await historiasAPI.getByProject(project.id_proyecto)
    setUserStories(stories)
    setIncentive("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedProject(null)
    setIncentive("")
  }

  const approveProject = async (e) => {
    e.preventDefault()

    if (!incentive) {
      onShowToast("Debe ingresar un incentivo", "error")
      return
    }

    try {
      await proyectosAPI.update(selectedProject.id_proyecto, {
        estado_proyecto: "aprobado",
        incentivo: incentive,
      })

      await aprobacionesAPI.create({
        fecha_aprobacion: new Date().toISOString().split("T")[0],
        estado_asignado: "aprobado",
        motivo_devolucion: null,
        id_proyecto: selectedProject.id_proyecto,
        id_gerente: currentUser.id_usuario,
      })

      onShowToast(`Proyecto "${selectedProject.nombre}" aprobado con éxito`, "success")
      closeModal()
      loadPendingProjects()
    } catch (error) {
      console.error("Error approving project:", error)
      onShowToast(`Error al aprobar proyecto: ${error.message}`, "error")
    }
  }

  const openReturnModal = () => {
    setReturnReason("")
    setShowReturnModal(true)
  }

  const confirmReturn = async (e) => {
    e.preventDefault()

    if (!returnReason.trim()) {
      onShowToast("Debe proporcionar un motivo de devolución", "error")
      return
    }

    try {
      await proyectosAPI.update(selectedProject.id_proyecto, {
        estado_proyecto: "devuelto",
      })

      await aprobacionesAPI.create({
        fecha_aprobacion: new Date().toISOString().split("T")[0],
        estado_asignado: "devuelto",
        motivo_devolucion: returnReason,
        id_proyecto: selectedProject.id_proyecto,
        id_gerente: currentUser.id_usuario,
      })

      onShowToast("Proyecto devuelto al líder para mejoras", "info")
      setShowReturnModal(false)
      closeModal()
      loadPendingProjects()
    } catch (error) {
      console.error("Error returning project:", error)
      onShowToast(`Error al devolver proyecto: ${error.message}`, "error")
    }
  }

  const openRejectModal = () => {
    setRejectReason("")
    setShowRejectModal(true)
  }

  const confirmReject = async (e) => {
    e.preventDefault()

    if (!rejectReason.trim()) {
      onShowToast("Debe proporcionar un motivo de rechazo", "error")
      return
    }

    try {
      await proyectosAPI.update(selectedProject.id_proyecto, {
        estado_proyecto: "no-aprobado",
      })

      await aprobacionesAPI.create({
        fecha_aprobacion: new Date().toISOString().split("T")[0],
        estado_asignado: "rechazado",
        motivo_devolucion: rejectReason,
        id_proyecto: selectedProject.id_proyecto,
        id_gerente: currentUser.id_usuario,
      })

      onShowToast("Proyecto NO aprobado", "error")
      setShowRejectModal(false)
      closeModal()
      loadPendingProjects()
    } catch (error) {
      console.error("Error rejecting project:", error)
      onShowToast(`Error al rechazar proyecto: ${error.message}`, "error")
    }
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

  const getAILevelInfo = (level) => {
    const info = {
      bajo: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "text-indigo-500" },
      medio: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: "text-purple-500" },
      alto: { color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", icon: "text-fuchsia-500" },
      avanzado: { color: "bg-pink-50 text-pink-700 border-pink-200", icon: "text-pink-500" },
    }
    return info[level] || info.bajo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando proyectos pendientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
            Aprobación de Proyectos
          </h2>
          <p className="text-gray-600">Revisa y aprueba los proyectos pendientes</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <Clock className="w-5 h-5 text-purple-600" />
          <span className="text-purple-700 font-semibold">{projects.length} pendiente(s)</span>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay proyectos pendientes</h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Todos los proyectos han sido revisados. ¡Buen trabajo!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id_proyecto}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
            >
              {/* Header with Title and Status */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2 flex-1">
                  {project.nombre?.toUpperCase()}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${project.estado_proyecto === "pendiente"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                >
                  {project.estado_proyecto === "pendiente" ? "Pendiente" : "En Revisión"}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.descripcion}</p>

              {/* AI Level Badge */}
              <div className="mb-4">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${getAILevelInfo(project.nivel_ia).color}`}
                >
                  <Brain className={`w-4 h-4 ${getAILevelInfo(project.nivel_ia).icon}`} />
                  IA: {getAILevelLabel(project.nivel_ia)}
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Empresa:</span>
                  <span className="truncate">{project.empresa?.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Período:</span>
                  <span className="text-xs">
                    {project.fecha_inicio} → {project.fecha_fin}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Duración:</span>
                  <span>
                    {project.duracion_estimada} {project.duracion_estimada === 1 ? "mes" : "meses"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openModal(project)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Revisar Proyecto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Revisar Proyecto" size="large">
        {selectedProject && (
          <div className="space-y-6">
            {/* Project Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{selectedProject.nombre?.toUpperCase()}</h3>
              <p className="text-purple-100 text-sm">{selectedProject.descripcion}</p>
            </div>

            {/* Project Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </div>
                <p className="font-semibold text-gray-800">{selectedProject.empresa?.toUpperCase()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Brain className="w-4 h-4" />
                  Nivel de IA
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-semibold ${getAILevelInfo(selectedProject.nivel_ia).color}`}
                >
                  {getAILevelLabel(selectedProject.nivel_ia)}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Período
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selectedProject.fecha_inicio} → {selectedProject.fecha_fin}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Duración Estimada
                </div>
                <p className="font-semibold text-gray-800">
                  {selectedProject.duracion_estimada} {selectedProject.duracion_estimada === 1 ? "mes" : "meses"}
                </p>
              </div>
            </div>

            {/* User Stories */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <FileText className="w-4 h-4" />
                Historias de Usuario ({userStories.length})
              </label>
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-48 overflow-y-auto">
                {userStories.length === 0 ? (
                  <p className="text-center text-gray-400 italic py-4 text-sm">No hay historias de usuario</p>
                ) : (
                  <ul className="space-y-2">
                    {userStories.map((story, index) => (
                      <li
                        key={story.id_historia}
                        className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{story.descripcion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Incentive Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <SparklesIcon className="w-4 h-4" />
                Incentivo a Asignar *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={incentive}
                  onChange={(e) => setIncentive(e.target.value)}
                  placeholder="Ingrese el tipo de incentivo para el proyecto"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-between pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openReturnModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg font-medium text-sm hover:bg-orange-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Devolver
                </button>
                <button
                  type="button"
                  onClick={openRejectModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  No Aprobar
                </button>

                <button
                  type="button"
                  onClick={approveProject}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprobar Proyecto
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Devolver Proyecto">
        <div className="space-y-5">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800">
              El proyecto será devuelto al líder para que realice las correcciones necesarias.
            </p>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Motivo de Devolución *</label>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              required
              rows="4"
              placeholder="Explique qué aspectos del proyecto deben ser mejorados..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 justify-between pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmReturn}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Confirmar Devolución
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="No Aprobar Proyecto">
        <div className="space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              <strong>Advertencia:</strong> Esta acción rechazará permanentemente el proyecto. El líder no podrá volver
              a enviarlo.
            </p>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Motivo de Rechazo *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              rows="4"
              placeholder="Explique por qué el proyecto no fue aprobado..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 justify-between pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmReject}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Confirmar Rechazo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
