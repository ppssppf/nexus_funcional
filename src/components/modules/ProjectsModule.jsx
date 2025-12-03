"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI, aprobacionesAPI } from "../../lib/api"
import { Modal } from "../Modal"
import {
  Plus,
  Calendar,
  Building2,
  Brain,
  Edit3,
  XCircle,
  Sparkles,
  Clock,
  FileText,
  Trash2,
  Eye,
  Award,
  AlertTriangle,
  MessageSquare,
  Target,
  Zap,
  Rocket,
  ChevronRight,
  AlertCircle,
  Upload,
  FileSpreadsheet,
} from "lucide-react"
import { extractStoriesFromFile } from "../../lib/gemini" // Added import

export const ProjectsModule = ({ onShowToast }) => {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelingProjectId, setCancelingProjectId] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectStories, setProjectStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    empresa: "",
    nivel_ia: "",
    fecha_inicio: "",
    fecha_fin: "",
    documento: "",
  })
  const [userStories, setUserStories] = useState([])
  const [newStory, setNewStory] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  // CHANGE: Estado para controlar la importación de historias
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [showReturnReasonModal, setShowReturnReasonModal] = useState(false)
  const [selectedReturnProject, setSelectedReturnProject] = useState(null)
  const [returnReason, setReturnReason] = useState("")
  const [loadingReturnReason, setLoadingReturnReason] = useState(false)
  // CHANGE: New state to know if it's a return or rejection
  const [reasonType, setReasonType] = useState("devuelto") // "devuelto" or "rechazado"
  const [projectApprovals, setProjectApprovals] = useState([])
  const [loadingApprovals, setLoadingApprovals] = useState(false)

  useEffect(() => {
    if (currentUser?.id_usuario) {
      loadProjects()
    }
  }, [currentUser])

  const loadProjects = async () => {
    if (!currentUser?.id_usuario) return

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

  const formatearFecha = (fecha) => {
    const date = new Date(fecha)
    return date.toLocaleDateString("es-CO")
  }

  const openDetailModal = async (project) => {
    setSelectedProject(project)
    setShowDetailModal(true)
    setLoadingStories(true)
    setLoadingApprovals(true)
    try {
      const stories = await historiasAPI.getByProject(project.id_proyecto)
      setProjectStories(stories)
    } catch (error) {
      console.error("Error loading stories:", error)
      setProjectStories([])
    } finally {
      setLoadingStories(false)
    }
    try {
      const approvals = await aprobacionesAPI.getByProject(project.id_proyecto)
      setProjectApprovals(approvals)
    } catch (error) {
      console.error("Error loading approvals:", error)
      setProjectApprovals([])
    } finally {
      setLoadingApprovals(false)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedProject(null)
    setProjectStories([])
    setProjectApprovals([])
  }

  useEffect(() => {
    const pid = sessionStorage.getItem("nexusNavigateProjectId")
    const target = sessionStorage.getItem("nexusNavigateTarget")
    if (pid && projects.length > 0 && target === "projectsDetail") {
      const p = projects.find((x) => String(x.id_proyecto) === String(pid))
      if (p) {
        openDetailModal(p)
        sessionStorage.removeItem("nexusNavigateProjectId")
        sessionStorage.removeItem("nexusNavigateTarget")
      }
    }
  }, [projects])

  const openModal = async (project = null) => {
    if (project) {
      if (project.estado_proyecto !== "devuelto") {
        onShowToast("Solo se pueden editar proyectos devueltos", "error")
        return
      }
      setEditingProject(project)
      setFormData({
        nombre: project.nombre,
        descripcion: project.descripcion,
        empresa: project.empresa,
        nivel_ia: project.nivel_ia,
        fecha_inicio: project.fecha_inicio,
        fecha_fin: project.fecha_fin,
        documento: project.documento || "",
      })
      const stories = await historiasAPI.getByProject(project.id_proyecto)
      setUserStories(stories.map((s) => ({ ...s, text: s.descripcion })))
    } else {
      setEditingProject(null)
      setFormData({
        nombre: "",
        descripcion: "",
        empresa: "",
        nivel_ia: "",
        fecha_inicio: "",
        fecha_fin: "",
        documento: "",
      })
      setUserStories([])
    }
    setCurrentStep(1)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setNewStory("")
    setCurrentStep(1)
    // Reset import state when closing the modal
    setIsImporting(false)
    setImportError(null)
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

  const handleImportStories = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que sea CSV o Excel
    const validExtensions = [".csv", ".xlsx", ".xls"]
    const fileExtension = "." + file.name.split(".").pop().toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      setImportError("Solo se permiten archivos CSV o Excel (.csv, .xlsx, .xls)")
      setTimeout(() => setImportError(null), 5000)
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      // Llamar a Gemini para extraer las historias
      const historias = await extractStoriesFromFile(file)

      // Agregar las historias extraídas al estado
      const newStories = historias.map((texto) => ({
        id: Date.now() + Math.random(), // ID único
        text: texto.trim(),
        completada: false,
        aprobada: false,
      }))

      setUserStories([...userStories, ...newStories])

      // Mostrar mensaje de éxito
      onShowToast(
        `${historias.length} historia${historias.length !== 1 ? "s" : ""} importada${historias.length !== 1 ? "s" : ""} exitosamente`,
        "success",
      )
    } catch (error) {
      console.error("Error al importar historias:", error)
      setImportError(error.message || "Error al importar historias del archivo")
    } finally {
      setIsImporting(false)
      // Resetear el input file
      event.target.value = ""
    }
  }

  const calculateDuration = () => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const start = new Date(formData.fecha_inicio)
      const end = new Date(formData.fecha_fin)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const months = Math.floor(diffDays / 30)
      return months
    }
    return null
  }

  const canProceedToStep2 = () => {
    return formData.nombre && formData.descripcion && formData.empresa && formData.nivel_ia
  }

  const canProceedToStep3 = () => {
    return formData.fecha_inicio && formData.fecha_fin
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (userStories.length === 0) {
      onShowToast("Debe agregar al menos una historia de usuario", "error")
      return
    }

    try {
      const duration = calculateDuration()
      const fechaActual = new Date().toLocaleDateString("sv-SE")

      const projectData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        fecha_creacion: fechaActual,
        duracion_estimada: duration,
        nivel_ia: formData.nivel_ia,
        documento: formData.documento || null,
        estado_proyecto: "pendiente",
        incentivo: null,
        id_lider: currentUser.id_usuario,
        empresa: formData.empresa,
      }

      if (editingProject) {
        await proyectosAPI.update(editingProject.id_proyecto, projectData)
        const oldStories = await historiasAPI.getByProject(editingProject.id_proyecto)
        for (const story of oldStories) {
          await historiasAPI.delete(story.id_historia)
        }
        for (const story of userStories) {
          await historiasAPI.create({
            titulo: "Historia de Usuario",
            descripcion: story.text,
            estado_historia: "pendiente",
            id_proyecto: editingProject.id_proyecto,
          })
        }
        onShowToast("Proyecto actualizado y enviado con éxito", "success")
      } else {
        const newProject = await proyectosAPI.create(projectData)
        const newProjectId = newProject.id_proyecto
        for (const story of userStories) {
          await historiasAPI.create({
            titulo: "Historia de Usuario",
            descripcion: story.text,
            estado_historia: "pendiente",
            id_proyecto: newProjectId,
          })
        }
        onShowToast("Proyecto enviado con éxito, a la espera de aprobación", "success")
      }

      closeModal()
      loadProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      onShowToast(`Error al guardar proyecto: ${error.message}`, "error")
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

  const openReturnReasonModal = async (project) => {
    setSelectedReturnProject(project)
    setShowReturnReasonModal(true)
    setLoadingReturnReason(true)
    setReturnReason("")

    const tipo = project.estado_proyecto === "no-aprobado" ? "rechazado" : "devuelto"
    setReasonType(tipo)

    try {
      const allApprovals = await aprobacionesAPI.getAll()

      // Filtrar por id_proyecto y estado_asignado
      const projectApprovals = allApprovals.filter(
        (a) => a.id_proyecto === project.id_proyecto && a.estado_asignado === tipo,
      )

      // Ordenar por fecha (desc) y, en empate, por id_aprobacion (desc) para obtener la más reciente
      const approvalFound = projectApprovals.sort((a, b) => {
        const da = new Date(a.fecha_aprobacion)
        const db = new Date(b.fecha_aprobacion)
        const cmp = db - da
        if (cmp !== 0) return cmp
        return (b.id_aprobacion || 0) - (a.id_aprobacion || 0)
      })[0]

      if (approvalFound && approvalFound.motivo_devolucion) {
        setReturnReason(approvalFound.motivo_devolucion)
      } else {
        setReturnReason("No se encontró el motivo registrado.")
      }
    } catch (error) {
      console.error("Error loading return reason:", error)
      setReturnReason("Error al cargar el motivo.")
    } finally {
      setLoadingReturnReason(false)
    }
  }

  const closeReturnReasonModal = () => {
    setShowReturnReasonModal(false)
    setSelectedReturnProject(null)
    setReturnReason("")
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

  const getStatusColor = (status) => {
    const colors = {
      pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "en-revision": "bg-purple-100 text-purple-700 border-purple-200",
      devuelto: "bg-orange-100 text-orange-700 border-orange-200",
      aprobado: "bg-green-100 text-green-700 border-green-200",
      "no-aprobado": "bg-red-100 text-red-700 border-red-200",
      cancelado: "bg-gray-100 text-gray-700 border-gray-200",
      completado: "bg-blue-100 text-blue-700 border-blue-200",
    }
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200"
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
      bajo: { color: "from-emerald-500 to-teal-500", icon: Target, description: "Automatización básica" },
      medio: { color: "from-blue-500 to-cyan-500", icon: Zap, description: "ML y análisis de datos" },
      alto: { color: "from-purple-500 to-pink-500", icon: Brain, description: "Deep Learning" },
      avanzado: { color: "from-orange-500 to-red-500", icon: Rocket, description: "IA Generativa" },
    }
    return info[level] || info.bajo
  }

  const getApprovalStateLabel = (estado) => {
    const labels = {
      devuelto: "Devuelto",
      aprobado: "Aprobado",
      "no-aprobado": "Rechazado", // This should match the state used in the API and DB
      rechazado: "Rechazado", // Added for clarity if 'rechazado' is directly used in approvals
    }
    return labels[estado] || estado
  }

  const getApprovalStateColor = (estado) => {
    const colors = {
      devuelto: "bg-orange-100 text-orange-700 border-orange-200",
      aprobado: "bg-green-100 text-green-700 border-green-200",
      "no-aprobado": "bg-red-100 text-red-700 border-red-200",
      rechazado: "bg-red-100 text-red-700 border-red-200", // Added for clarity
    }
    return colors[estado] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const aiLevels = [
    {
      value: "bajo",
      label: "Bajo",
      icon: Target,
      color: "from-emerald-500 to-teal-500",
      description: "Automatización básica",
    },
    {
      value: "medio",
      label: "Medio",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      description: "ML y análisis de datos",
    },
    { value: "alto", label: "Alto", icon: Brain, color: "from-purple-500 to-pink-500", description: "Deep Learning" },
    {
      value: "avanzado",
      label: "Avanzado",
      icon: Rocket,
      color: "from-orange-500 to-red-500",
      description: "IA Generativa",
    },
  ]

  const steps = [
    { number: 1, title: "Información", icon: FileText },
    { number: 2, title: "Cronograma", icon: Calendar },
    { number: 3, title: "Historias", icon: Target },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando proyectos...</p>
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
            Gestión de Proyectos
          </h2>
          <p className="text-gray-600">Administra y da seguimiento a tus proyectos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay proyectos aún</h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Comienza creando tu primer proyecto usando el botón "Nuevo Proyecto"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id_proyecto}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2 flex-1">
                  {project.nombre?.toUpperCase()}
                </h3>
                {project.estado_proyecto === "devuelto" || project.estado_proyecto === "no-aprobado" ? (
                  <button
                    onClick={() => openReturnReasonModal(project)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 border ${getStatusColor(project.estado_proyecto)} hover:ring-2 hover:ring-${project.estado_proyecto === "devuelto" ? "orange" : "red"}-300 transition-all cursor-pointer`}
                    title={
                      project.estado_proyecto === "devuelto" ? "Ver motivo de devolución" : "Ver motivo de rechazo"
                    }
                  >
                    {getStatusLabel(project.estado_proyecto)}
                  </button>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 border ${getStatusColor(project.estado_proyecto)}`}
                  >
                    {getStatusLabel(project.estado_proyecto)}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.descripcion}</p>
              <div className="mb-4">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    project.nivel_ia === "bajo"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : project.nivel_ia === "medio"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : project.nivel_ia === "alto"
                          ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
                          : "bg-pink-50 text-pink-700 border border-pink-200"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  IA: {getAILevelLabel(project.nivel_ia)}
                </div>
              </div>
              <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Empresa:</span>
                  <span>{project.empresa?.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Período:</span>
                  <span className="text-xs">
                    {formatearFecha(project.fecha_inicio)} → {formatearFecha(project.fecha_fin)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Creado:</span>
                  <span className="text-xs">{formatearFecha(project.fecha_creacion)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openDetailModal(project)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalle
                </button>

                {project.estado_proyecto === "devuelto" && (
                  <button
                    onClick={() => openModal(project)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {(project.estado_proyecto === "pendiente" || project.estado_proyecto === "aprobado") && (
                  <button
                    onClick={() => openCancelModal(project.id_proyecto)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Motivo de Devolución/Rechazo */}
      <Modal
        isOpen={showReturnReasonModal}
        onClose={() => setShowReturnReasonModal(false)}
        title={reasonType === "rechazado" ? "Motivo de Rechazo" : "Motivo de Devolución"}
      >
        {selectedReturnProject && (
          <div className="space-y-5">
            <div
              className={`${reasonType === "rechazado" ? "bg-gradient-to-r from-red-500 to-rose-500" : "bg-gradient-to-r from-orange-500 to-amber-500"} rounded-xl p-4 text-white`}
            >
              <p className="text-sm opacity-90 mb-1">Proyecto</p>
              <h3 className="text-lg font-bold">{selectedReturnProject.nombre?.toUpperCase()}</h3>
            </div>

            {/* Motivo */}
            <div
              className={`${reasonType === "rechazado" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"} border rounded-xl p-4`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 ${reasonType === "rechazado" ? "bg-red-100" : "bg-orange-100"} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${reasonType === "rechazado" ? "text-red-600" : "text-orange-600"}`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-semibold ${reasonType === "rechazado" ? "text-red-800" : "text-orange-800"} uppercase tracking-wide mb-2`}
                  >
                    {reasonType === "rechazado" ? "Razón del rechazo" : "Razón de la devolución"}
                  </p>
                  {loadingReturnReason ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span className="text-sm">Cargando...</span>
                    </div>
                  ) : (
                    <p
                      className={`${reasonType === "rechazado" ? "text-red-900" : "text-orange-900"} text-sm leading-relaxed`}
                    >
                      {returnReason || "No se encontró el motivo registrado."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowReturnReasonModal(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              {selectedReturnProject.estado_proyecto === "devuelto" && (
                <button
                  onClick={() => {
                    setShowReturnReasonModal(false)
                    openModal(selectedReturnProject)
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Proyecto
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDetailModal} onClose={closeDetailModal} title="Detalle del Proyecto" size="large">
        {selectedProject && (
          <div className="space-y-6">
            {/* Header con nombre y estado */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 backdrop-blur-sm`}
                  >
                    {getStatusLabel(selectedProject.estado_proyecto)}
                  </span>
                  <h3 className="text-2xl font-bold mb-2">{selectedProject.nombre?.toUpperCase()}</h3>
                  <p className="text-purple-100 text-sm">{selectedProject.descripcion}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center ml-4">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Información en grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Empresa */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Building2 className="w-4 h-4" />
                  EMPRESA
                </div>
                <p className="text-gray-800 font-semibold">{selectedProject.empresa?.toUpperCase()}</p>
              </div>

              {/* Nivel de IA */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Brain className="w-4 h-4" />
                  NIVEL DE IA
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const aiInfo = getAILevelInfo(selectedProject.nivel_ia)
                    const Icon = aiInfo.icon
                    return (
                      <>
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${aiInfo.color} flex items-center justify-center`}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold">{getAILevelLabel(selectedProject.nivel_ia)}</p>
                          <p className="text-xs text-gray-500">{aiInfo.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Fecha de Inicio */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Calendar className="w-4 h-4" />
                  FECHA DE INICIO
                </div>
                <p className="text-gray-800 font-semibold">{formatearFecha(selectedProject.fecha_inicio)}</p>
              </div>

              {/* Fecha de Fin */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Calendar className="w-4 h-4" />
                  FECHA DE FIN
                </div>
                <p className="text-gray-800 font-semibold">{formatearFecha(selectedProject.fecha_fin)}</p>
              </div>
            </div>

            {/* Duración y Fecha de creación */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-800 text-sm font-medium">Duración Estimada</p>
                    <p className="text-3xl font-bold mt-1">
                      {selectedProject.duracion_estimada} {selectedProject.duracion_estimada === 1 ? "mes" : "meses"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Clock className="w-4 h-4" />
                  FECHA DE CREACIÓN
                </div>
                <p className="text-gray-800 font-semibold">{formatearFecha(selectedProject.fecha_creacion)}</p>
              </div>
            </div>

            {selectedProject.estado_proyecto === "aprobado" && selectedProject.incentivo && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-800 text-xs font-semibold uppercase tracking-wide mb-1">
                      Incentivo Asignado
                    </p>
                    <p className="text-amber-900 text-xl font-bold">{selectedProject.incentivo}</p>
                  </div>
                  <div className="hidden sm:block">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>
            )}

            {projectApprovals.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-semibold">Historial de Revisiones</h4>
                    <p className="text-xs text-gray-500">Comentarios del gerente sobre el proyecto</p>
                  </div>
                </div>

                {loadingApprovals ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectApprovals.map((approval, index) => (
                      <div
                        key={approval.id_aprobacion || index}
                        className="bg-white rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getApprovalStateColor(approval.estado_asignado)}`}
                          >
                            {getApprovalStateLabel(approval.estado_asignado)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {approval.fecha_aprobacion ? formatearFecha(approval.fecha_aprobacion) : "Sin fecha"}
                          </span>
                        </div>
                        {approval.motivo_devolucion && (
                          <p className="text-sm text-gray-700 leading-relaxed mt-2">{approval.motivo_devolucion}</p>
                        )}
                        {!approval.motivo_devolucion && approval.estado_asignado === "aprobado" && (
                          <p className="text-sm text-green-600 italic mt-2">
                            Proyecto aprobado sin observaciones adicionales.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Historias de Usuario */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-700">Historias de Usuario</h4>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                {loadingStories ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : projectStories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <FileText className="w-10 h-10 mb-2" />
                    <p className="text-sm">No hay historias de usuario</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {projectStories.map((story, index) => (
                      <li
                        key={story.id_historia}
                        className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{story.descripcion}</p>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              story.estado_historia === "completada"
                                ? "bg-green-100 text-green-700"
                                : story.estado_historia === "aprobada"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {story.estado_historia === "completada"
                              ? "Completada"
                              : story.estado_historia === "aprobada"
                                ? "Aprobada"
                                : "Pendiente"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {projectStories.length} historia{projectStories.length !== 1 ? "s" : ""} de usuario
              </p>
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={closeDetailModal}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Project Modal - Diseño mejorado con pasos */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProject ? "Editar Proyecto" : "Nuevo Proyecto"}
        size="large"
      >
        <div className="space-y-6">
          {/* Stepper mejorado */}
          <div className="flex items-center justify-between px-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isActive ? "text-purple-600" : "text-gray-500"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-3">
                      <div className={`h-1 rounded-full ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Step 1: Información del Proyecto */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-purple-700">
                  <strong>Paso 1:</strong> Define la información básica de tu proyecto
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-sm"
                  placeholder="Ej: Sistema de gestión de inventarios"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Descripción *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-sm resize-none"
                  placeholder="Describe brevemente el objetivo y alcance del proyecto..."
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Empresa *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Ingresa el nombre de la empresa"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Nivel de Inteligencia Artificial *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {aiLevels.map((level) => {
                    const Icon = level.icon
                    const isSelected = formData.nivel_ia === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, nivel_ia: level.value })}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center mb-2`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className={`font-semibold text-sm ${isSelected ? "text-purple-700" : "text-gray-800"}`}>
                          {level.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{level.description}</p>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    canProceedToStep2()
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Cronograma */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>Paso 2:</strong> Establece el cronograma del proyecto
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Fecha de Inicio *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Fecha de Fin *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Duración calculada con diseño visual */}
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Duración Estimada</p>
                    <p className="text-3xl font-bold mt-1">
                      {calculateDuration() !== null
                        ? `${calculateDuration()} ${calculateDuration() === 1 ? "mes" : "meses"}`
                        : "---"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>
                {calculateDuration() === null && (
                  <p className="text-purple-200 text-xs mt-2">Selecciona las fechas para calcular</p>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep3()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    canProceedToStep3()
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Historias de Usuario */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm text-emerald-700">
                  <strong>Paso 3:</strong> Agrega las historias de usuario del proyecto
                </p>
              </div>

              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  Historias de Usuario *
                </label>

                {/* Input para agregar historia */}
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={newStory}
                    onChange={(e) => setNewStory(e.target.value)}
                    placeholder="Ej: Como usuario quiero poder iniciar sesión..."
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all text-sm"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addUserStory())}
                  />
                  <button
                    type="button"
                    onClick={addUserStory}
                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                  <label className="relative">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleImportStories}
                      disabled={isImporting}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.currentTarget.previousElementSibling.click()
                      }}
                      disabled={isImporting}
                      className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Importar historias desde CSV o Excel"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Importar
                        </>
                      )}
                    </button>
                  </label>
                </div>

                {importError && (
                  <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Error al importar</p>
                      <p className="text-xs text-red-600 mt-1">{importError}</p>
                    </div>
                  </div>
                )}

                {userStories.length === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800">Importa historias fácilmente</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Puedes importar historias desde un archivo CSV o Excel. La IA leerá el archivo y las agregará
                        automáticamente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Lista de historias */}
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-4 min-h-[200px]">
                  {userStories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[180px] text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-medium">No hay historias agregadas</p>
                      <p className="text-xs mt-1">Escribe y agrega al menos una historia de usuario</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {userStories.map((story, index) => (
                        <li
                          key={story.id}
                          className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {index + 1}
                          </div>
                          <span className="flex-1 text-sm text-gray-700 pt-1">{story.text}</span>
                          <button
                            type="button"
                            onClick={() => removeUserStory(story.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  {userStories.length} historia{userStories.length !== 1 ? "s" : ""} agregada
                  {userStories.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={userStories.length === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    userStories.length > 0
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  {editingProject ? "Actualizar Proyecto" : "Crear Proyecto"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Cancel Modal - Diseño mejorado */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Proyecto">
        <div className="space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Advertencia</p>
              <p className="text-sm text-red-700 mt-1">
                Esta acción cancelará permanentemente el proyecto y no se puede deshacer.
              </p>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Justificación de Cancelación *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows="4"
              placeholder="Explique detalladamente por qué está cancelando este proyecto..."
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100 transition-all text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Volver
            </button>
            <button
              type="submit"
              onClick={confirmCancel}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all"
            >
              Confirmar Cancelación
            </button>
          </div>
        </div>
      </Modal>

      {/* Return Reason Modal */}
      <Modal
        isOpen={showReturnReasonModal}
        onClose={closeReturnReasonModal}
        title={reasonType === "rechazado" ? "Motivo de Rechazo" : "Motivo de Devolución"}
        size="medium"
      >
        {selectedReturnProject && (
          <div className="space-y-5">
            {/* Header con gradiente dinámico */}
            <div
              className={`rounded-xl p-5 text-white ${
                reasonType === "rechazado"
                  ? "bg-gradient-to-r from-red-500 to-rose-500"
                  : "bg-gradient-to-r from-orange-500 to-amber-500"
              }`}
            >
              <h3 className="text-xl font-bold mb-1">{selectedReturnProject.nombre}</h3>
              <p className={reasonType === "rechazado" ? "text-red-100 text-sm" : "text-orange-100 text-sm"}>
                {reasonType === "rechazado"
                  ? "Este proyecto no fue aprobado"
                  : "Este proyecto fue devuelto para revisión"}
              </p>
            </div>

            {/* Motivo dinámico */}
            <div
              className={`border-2 rounded-xl p-5 ${
                reasonType === "rechazado" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    reasonType === "rechazado" ? "bg-red-100" : "bg-orange-100"
                  }`}
                >
                  {reasonType === "rechazado" ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-2 ${reasonType === "rechazado" ? "text-red-800" : "text-orange-800"}`}
                  >
                    {reasonType === "rechazado" ? "Motivo del Rechazo" : "Observaciones del Gerente"}
                  </h4>
                  {loadingReturnReason ? (
                    <div
                      className={`flex items-center gap-2 ${
                        reasonType === "rechazado" ? "text-red-600" : "text-orange-600"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-2 rounded-full animate-spin ${
                          reasonType === "rechazado"
                            ? "border-red-300 border-t-red-600"
                            : "border-orange-300 border-t-orange-600"
                        }`}
                      ></div>
                      <span className="text-sm">Cargando motivo...</span>
                    </div>
                  ) : (
                    <p className={`leading-relaxed ${reasonType === "rechazado" ? "text-red-700" : "text-orange-700"}`}>
                      {returnReason ||
                        (reasonType === "rechazado"
                          ? "No se encontró el motivo del rechazo."
                          : "No se encontró el motivo de devolución.")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones dinámicos */}
            <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={closeReturnReasonModal}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              {/* Solo mostrar botón de editar si es devuelto, no si es rechazado */}
              {reasonType === "devuelto" && (
                <button
                  type="button"
                  onClick={() => {
                    closeReturnReasonModal()
                    openModal(selectedReturnProject)
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Proyecto
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
