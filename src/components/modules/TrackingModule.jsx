"use client"

import { useState, useEffect } from "react"
import Modal from "../Modal"
import { Toast } from "../Toast"
import {
  proyectosAPI,
  historiasAPI,
  aprobacionesHistoriaAPI,
  evidenciasAPI,
  usuariosAPI,
  empresasAPI,
} from "../../lib/api"
import { useAuth } from "../../contexts/AuthContext"
import {
  Building2,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  Upload,
  Download,
  Eye,
  FileSpreadsheet,
  Users,
  TrendingUp,
  Sparkles,
  FileCheck,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react"

export const TrackingModule = () => {
  const { currentUser, isManager } = useAuth()

  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [selectedStories, setSelectedStories] = useState([])
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [showLeaderModal, setShowLeaderModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [showProgressDetailsModal, setShowProgressDetailsModal] = useState(false)
  const [showLeaderRejectModal, setShowLeaderRejectModal] = useState(false)
  const [pendingEvidences, setPendingEvidences] = useState([])
  const [projectStories, setProjectStories] = useState({})
  const [navLoading, setNavLoading] = useState(false)
  const [rejectDetail, setRejectDetail] = useState(null)

  const [projectLeader, setProjectLeader] = useState(null)
  const [projectCompany, setProjectCompany] = useState(null)
  const [leaders, setLeaders] = useState({})

  const [managerComment, setManagerComment] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [toast, setToast] = useState(null)

  const onShowToast = (message, type = "info") => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  const isValidFileType = (file) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ]
    const validExtensions = [".xls", ".xlsx", ".csv"]
    return validTypes.includes(file.type) || validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  }

  const uploadToCloudinary = async (file) => {
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME // dzxuwgzn5
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_KEY_NAME // nexus

    console.log("Uploading to Cloudinary:", { CLOUD_NAME, UPLOAD_PRESET })

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", UPLOAD_PRESET)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("Cloudinary error:", error)
      throw new Error(error.error?.message || "Error al subir archivo")
    }

    return await response.json()
  }

  useEffect(() => {
    loadProjects()
  }, [currentUser, isManager])

  const loadProjects = async () => {
    try {
      setLoading(true)
      let data

      if (isManager) {
        data = await proyectosAPI.getAll()
      } else {
        data = await proyectosAPI.getByLeader(currentUser.id_usuario)
      }

      const approved = data.filter((p) => p.estado_proyecto === "aprobado")
      setProjects(approved)

      // Cargar líderes automáticamente
      const leaderIds = [...new Set(approved.map(p => p.id_lider))]

      const leadersMap = {}

      for (const id of leaderIds) {
        try {
          const leader = await usuariosAPI.getById(id)
          leadersMap[id] = leader
        } catch (error) {
          console.error("Error cargando líder:", error)
        }
      }

      setLeaders(leadersMap)

      const storiesMap = {}
      for (const project of approved) {
        try {
          const stories = await historiasAPI.getByProject(project.id_proyecto)
          storiesMap[project.id_proyecto] = stories
        } catch (error) {
          console.error(`Error loading stories for project ${project.id_proyecto}:`, error)
          storiesMap[project.id_proyecto] = []
        }
      }
      setProjectStories(storiesMap)
    } catch (error) {
      console.error("Error loading projects:", error)
      onShowToast("Error al cargar proyectos", "error")
    } finally {
      setLoading(false)
    }
  }

  const openLeaderModal = async (project) => {
    setSelectedProject(project)
    const stories = projectStories[project.id_proyecto] || []
    setUserStories(stories)
    setSelectedStories([])
    setEvidenceFile(null)
    setShowLeaderModal(true)
  }

  const openProgressDetailsModal = async (project) => {
    setSelectedProject(project)
    const wait = (ms) => new Promise((res) => setTimeout(res, ms))
    const fetchStoriesWithRetry = async (attempts = 3, delayMs = 500) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const s = await historiasAPI.getByProject(project.id_proyecto)
          const hasPending = s.some((x) => x.estado_historia === "en_revision")
          if (hasPending || i === attempts - 1) return s
          await wait(delayMs)
        } catch (error) {
          if (i === attempts - 1) return []
          await wait(delayMs)
        }
      }
      return []
    }

    const stories = await fetchStoriesWithRetry(3, 600)
    setProjectStories((prev) => ({ ...prev, [project.id_proyecto]: stories }))
    setUserStories(stories)

    try {
      const leader = await usuariosAPI.getById(project.id_lider)
      setProjectLeader(leader)
    } catch (error) {
      console.error("Error loading leader:", error)
      setProjectLeader(null)
    }

    try {
      const company = await empresasAPI.getById(project.id_empresa)
      setProjectCompany(company)
    } catch (error) {
      console.error("Error loading company:", error)
      setProjectCompany(null)
    }

    const storiesInReview = stories.filter((s) => s.estado_historia === "en_revision")
    const evidences = []
    for (const story of storiesInReview) {
      try {
        const storyEvidences = await evidenciasAPI.getByHistory(story.id_historia)
        evidences.push(...storyEvidences.map((ev) => ({ ...ev, historia: story })))
      } catch (error) {
        // no-op
      }
    }
    setPendingEvidences(evidences)

    setSelectedStories(storiesInReview.map((s) => s.id_historia))

    setShowProgressDetailsModal(true)
  }

  useEffect(() => {
    const pid = sessionStorage.getItem("nexusNavigateProjectId")
    const target = sessionStorage.getItem("nexusNavigateTarget")
    const hid = sessionStorage.getItem("nexusNavigateHistoryId")
    if (pid && projects.length > 0 && target === "trackingReview") {
      const p = projects.find((x) => String(x.id_proyecto) === String(pid))
      if (p) {
        (async () => {
          setNavLoading(true)
          try {
            await openProgressDetailsModal(p)
          } finally {
            sessionStorage.removeItem("nexusNavigateProjectId")
            sessionStorage.removeItem("nexusNavigateTarget")
            sessionStorage.removeItem("nexusNavigateHistoryId")
            setNavLoading(false)
          }
        })()
      }
    }
    if (pid && hid && projects.length > 0 && target === "leaderReject") {
      const p = projects.find((x) => String(x.id_proyecto) === String(pid))
      if (p) {
        (async () => {
          setNavLoading(true)
          try {
            const stories = await historiasAPI.getByProject(p.id_proyecto)
            setProjectStories((prev) => ({ ...prev, [p.id_proyecto]: stories }))
            const story = stories.find((s) => String(s.id_historia) === String(hid))
            const approvals = await aprobacionesHistoriaAPI.getAll()
            const last = approvals
              .filter((a) => String(a.id_historia) === String(hid) && a.estado === "rechazado")
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
            let manager = null
            if (last?.id_gerente) {
              try { manager = await usuariosAPI.getById(last.id_gerente) } catch { manager = null }
            }
            setSelectedProject(p)
            setRejectDetail({ project: p, story, approval: last, manager })
            setShowLeaderRejectModal(true)
          } finally {
            sessionStorage.removeItem("nexusNavigateProjectId")
            sessionStorage.removeItem("nexusNavigateTarget")
            sessionStorage.removeItem("nexusNavigateHistoryId")
            setNavLoading(false)
          }
        })()
      }
    }
  }, [projects])

  const openManagerModal = async (project) => {
    setSelectedProject(project)
    const stories = projectStories[project.id_proyecto] || []
    setUserStories(stories)

    const pendingIds = stories.filter((s) => s.estado_historia === "en_revision").map((s) => s.id_historia)
    setSelectedStories(pendingIds)

    setShowManagerModal(true)
  }

  const submitLeaderProgress = async (e) => {
    e.preventDefault()

    if (selectedStories.length === 0) {
      onShowToast("Debe seleccionar al menos una historia completada", "error")
      return
    }

    if (!evidenceFile) {
      onShowToast("Debe cargar un archivo de evidencia", "error")
      return
    }

    if (!isValidFileType(evidenceFile)) {
      onShowToast("Solo se permiten archivos Excel (.xls, .xlsx) o CSV (.csv)", "error")
      return
    }

    try {
      setUploadingFile(true)
      onShowToast("Subiendo evidencia...", "info")
      const uploadResult = await uploadToCloudinary(evidenceFile)

      for (const storyId of selectedStories) {
        await historiasAPI.update(storyId, {
          estado_historia: "en_revision",
        })

        await evidenciasAPI.create({
          archivo_url: uploadResult.url,
          fecha_subida: new Date().toISOString().split("T")[0],
          estado_evidencia: "pendiente",
          observacion_gerente: null,
          id_historia: storyId,
        })
      }

      onShowToast("Progreso enviado al gerente para aprobación", "success")
      setShowLeaderModal(false)
      loadProjects()
    } catch (error) {
      console.error("Error submitting progress:", error)
      onShowToast(`Error al enviar progreso: ${error.message}`, "error")
    } finally {
      setUploadingFile(false)
    }
  }

  const approveProgress = async (e) => {
    e.preventDefault()

    if (selectedStories.length === 0) {
      onShowToast("Debe seleccionar al menos una historia para aprobar", "error")
      return
    }

    try {
      for (const storyId of selectedStories) {
        await historiasAPI.update(storyId, {
          estado_historia: "aprobado",
        })

        await aprobacionesHistoriaAPI.create({
          fecha: new Date().toISOString().split("T")[0],
          estado: "aprobado",
          comentario: managerComment,
          id_historia: storyId,
          id_gerente: currentUser.id_usuario,
        })
      }

      const allStories = await historiasAPI.getByProject(selectedProject.id_proyecto)
      const allApproved = allStories.every((s) => s.estado_historia === "aprobado")

      if (allApproved) {
        await proyectosAPI.update(selectedProject.id_proyecto, {
          estado_proyecto: "completado",
        })
        onShowToast("Proyecto completado: todas las historias han sido aprobadas", "success")
      } else {
        onShowToast(
          `${selectedStories.length} ${selectedStories.length === 1 ? "historia aprobada" : "historias aprobadas"}`,
          "success",
        )
      }

      setShowProgressDetailsModal(false)
      setShowManagerModal(false)
      loadProjects()
    } catch (error) {
      console.error("Error approving progress:", error)
      onShowToast(`Error al aprobar progreso: ${error.message}`, "error")
    }
  }

  const openRejectModal = () => {
    setRejectReason("")
    setShowRejectModal(true)
  }

  const confirmRejectProgress = async () => {
    if (!rejectReason.trim()) {
      onShowToast("Debe proporcionar una razón para rechazar", "error")
      return
    }

    try {
      const pendingStories = userStories.filter((s) => s.estado_historia === "en_revision")

      for (const story of pendingStories) {
        await historiasAPI.update(story.id_historia, {
          estado_historia: "pendiente",
        })

        // Opcional: Guardar la razón del rechazo
        await aprobacionesHistoriaAPI.create({
          fecha: new Date().toISOString().split("T")[0],
          estado: "rechazado",
          comentario: rejectReason,
          id_historia: story.id_historia,
          id_gerente: currentUser.id_usuario,
        })
      }

      onShowToast("Progreso rechazado. Las historias han vuelto a estado pendiente.", "info")
      setShowRejectModal(false)
      setShowProgressDetailsModal(false)
      setShowManagerModal(false)
      loadProjects()
    } catch (error) {
      console.error("Error rejecting progress:", error)
      onShowToast(`Error al rechazar progreso: ${error.message}`, "error")
    }
  }

  const toggleStory = (storyId) => {
    setSelectedStories((prev) => (prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]))
  }

  const getIncentiveLabel = (incentive) => {
    const labels = {
      economico: "Económico",
      laboral: "Laboral",
      temporal: "Temporal",
      formacion: "Formación",
      recursos: "Recursos",
      otro: "Otro",
    }
    return labels[incentive] || incentive
  }

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
      {navLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Cargando detalles…</p>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
            Seguimiento de Proyectos
          </h2>
          <p className="text-gray-600">Monitorea el progreso y gestiona las evidencias</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-700">{projects.length} proyectos activos</span>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay proyectos en seguimiento</h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Los proyectos aprobados aparecerán aquí para dar seguimiento a su progreso
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const stories = projectStories[project.id_proyecto] || []
            const approvedCount = stories.filter((s) => s.estado_historia === "aprobado").length
            const pendingCount = stories.filter((s) => s.estado_historia === "en_revision").length
            const totalCount = stories.length
            const progress = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

            return (
              <div
                key={project.id_proyecto}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Project Info */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                        {project.nombre?.toUpperCase()}
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                        Aprobado
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Empresa:</span>
                        <span>{project.empresa?.toUpperCase() || project.id_empresa}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Líder:</span>
                        <span>{leaders[project.id_lider]?.nombre?.toUpperCase() || "Cargando..."}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Período:</span>
                        <span className="text-xs">
                          {project.fecha_inicio} → {project.fecha_fin}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Incentivo:</span>
                        <span>{getIncentiveLabel(project.incentivo) || "N/A"}</span>
                      </div>
                    </div>

                    {/* Stories Summary */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">{approvedCount} aprobadas</span>
                      </div>
                      {pendingCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm animate-pulse">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-amber-700">{pendingCount} en revisión</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                        <FileCheck className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-600">{totalCount} total</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="flex flex-col justify-center">
                    <div className="text-center mb-3">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {progress}%
                      </span>
                      <p className="text-sm text-gray-500 mt-1">Progreso total</p>
                    </div>
                    <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-center lg:justify-end">
                    {isManager && pendingCount > 0 ? (
                      <button
                        onClick={() => openProgressDetailsModal(project)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                      >
                        <Eye className="w-5 h-5" />
                        Revisar ({pendingCount})
                      </button>
                    ) : !isManager ? (
                      <button
                        onClick={() => openLeaderModal(project)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                      >
                        <Upload className="w-5 h-5" />
                        Actualizar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Al día</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Actualizar Progreso (Líder) */}
      <Modal isOpen={showLeaderModal} onClose={() => setShowLeaderModal(false)} title="Seguimiento del Proyecto" size="large">
        {selectedProject && (
          <div className="space-y-6">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 -m-6 mb-6 p-6 rounded-t-lg">
              <h3 className="text-xl font-bold text-white mb-1">{selectedProject.nombre?.toUpperCase()}</h3>
              <p className="text-purple-100">Seleccione las historias completadas y adjunte la evidencia</p>
            </div>

            <form onSubmit={submitLeaderProgress} className="space-y-6">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Historias de Usuario Completadas
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 max-h-72 overflow-y-auto space-y-2">
                  {userStories.map((story, index) => {
                    const isDisabled = story.estado_historia === "aprobado" || story.estado_historia === "en_revision"
                    const isSelected = selectedStories.includes(story.id_historia)

                    return (
                      <div
                        key={story.id_historia}
                        onClick={() => !isDisabled && toggleStory(story.id_historia)}
                        className={`flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-lg transition-all ${isDisabled
                          ? "border-gray-200 opacity-60 bg-gray-50 cursor-not-allowed"
                          : isSelected
                            ? "border-purple-500 bg-purple-50 cursor-pointer"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer"
                          }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${story.estado_historia === "aprobado"
                            ? "bg-green-100 text-green-700"
                            : story.estado_historia === "en_revision"
                              ? "bg-amber-100 text-amber-700"
                              : isSelected
                                ? "bg-purple-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                        >
                          {story.estado_historia === "aprobado" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : story.estado_historia === "en_revision" ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="flex-1 text-sm text-gray-700">{story.descripcion}</span>
                        {story.estado_historia === "aprobado" && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Aprobada
                          </span>
                        )}
                        {story.estado_historia === "en_revision" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                            En revisión
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Archivo de Evidencia *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors bg-gray-50">
                  <input
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files[0])}
                    required
                    accept=".xls,.xlsx,.csv"
                    className="hidden"
                    id="evidence-file"
                  />
                  <label htmlFor="evidence-file" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    {evidenceFile ? (
                      <p className="text-purple-600 font-medium">{evidenceFile.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-600 font-medium">Haga clic para seleccionar archivo</p>
                        <p className="text-sm text-gray-400 mt-1">Excel (.xls, .xlsx) o CSV (.csv)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-between pt-4 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowLeaderModal(false)}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Enviar Progreso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal Detalles del Progreso (Gerente) */}
      <Modal isOpen={showProgressDetailsModal} onClose={() => setShowProgressDetailsModal(false)} title="Seguimiento Del Proyecto" size="large">
        {selectedProject && (
          <div className="space-y-6">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 -m-6 mb-6 p-6 rounded-t-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{selectedProject.nombre?.toUpperCase()}</h3>
                  <p className="text-amber-100">Revisión de progreso del proyecto</p>
                </div>
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                  {userStories.filter((s) => s.estado_historia === "en_revision").length} pendientes
                </span>
              </div>
            </div>

            {/* Project Info Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">Líder:</span>
                <span className="text-gray-600">{projectLeader?.nombre?.toUpperCase() || "Cargando..."}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">Empresa:</span>
                <span className="text-gray-600">
                  {selectedProject.empresa?.toUpperCase() || "Cargando..."}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">Período:</span>
                <span className="text-gray-600">
                  {selectedProject.fecha_inicio} → {selectedProject.fecha_fin}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">Incentivo:</span>
                <span className="text-gray-600">{getIncentiveLabel(selectedProject.incentivo) || "N/A"}</span>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-green-600">
                  {projectStories[selectedProject.id_proyecto]?.filter((s) => s.estado_historia === "aprobado")
                    .length || 0}
                </p>
                <p className="text-xs text-gray-500">Aprobadas</p>
              </div>
              <div className="w-px h-10 bg-gray-300" />
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-amber-600">
                  {projectStories[selectedProject.id_proyecto]?.filter((s) => s.estado_historia === "en_revision")
                    .length || 0}
                </p>
                <p className="text-xs text-gray-500">En revisión</p>
              </div>
              <div className="w-px h-10 bg-gray-300" />
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-purple-600">
                  {projectStories[selectedProject.id_proyecto]?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>

            {/* Stories List */}
            <div>
              <label className="block mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Historias Pendientes de Aprobación
              </label>
              <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                {userStories
                  .filter((s) => s.estado_historia === "en_revision")
                  .map((story, index) => {
                    const storyEvidences = pendingEvidences.filter((ev) => ev.id_historia === story.id_historia)
                    return (
                      <div key={story.id_historia} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            id={`story-detail-${story.id_historia}`}
                            checked={selectedStories.includes(story.id_historia)}
                            onChange={() => toggleStory(story.id_historia)}
                            className="w-5 h-5 cursor-pointer mt-0.5 accent-purple-600"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`story-detail-${story.id_historia}`}
                              className="cursor-pointer font-medium text-gray-800"
                            >
                              {story.descripcion}
                            </label>
                          </div>
                        </div>
                        {storyEvidences.length > 0 && (
                          <div className="ml-8 space-y-2">
                            {storyEvidences.map((evidence, idx) => (
                              <div
                                key={evidence.id_evidencia}
                                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="font-medium text-blue-800">Evidencia {idx + 1}</span>
                                    <span className="text-gray-500 ml-2">({evidence.fecha_subida})</span>
                                  </div>
                                  <a
                                    href={evidence.archivo_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Descargar
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex gap-3 justify-between pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={() => setShowProgressDetailsModal(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={openRejectModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={approveProgress}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprobar Seleccionadas
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Aprobar Progreso (Gerente) - Simple */}
      <Modal isOpen={showManagerModal} onClose={() => setShowManagerModal(false)} title="" size="large">
        {selectedProject && (
          <div className="space-y-6">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 -m-6 mb-6 p-6 rounded-t-lg">
              <h3 className="text-xl font-bold text-white mb-1">{selectedProject.nombre}</h3>
              <p className="text-green-100">
                {userStories.filter((s) => s.estado_historia === "en_revision").length} historias pendientes de
                aprobación
              </p>
            </div>

            <form onSubmit={approveProgress} className="space-y-6">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Historias de Usuario Pendientes
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 max-h-72 overflow-y-auto space-y-2">
                  {userStories
                    .filter((s) => s.estado_historia === "en_revision")
                    .map((story, index) => (
                      <div
                        key={story.id_historia}
                        onClick={() => toggleStory(story.id_historia)}
                        className={`flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-lg transition-all cursor-pointer ${selectedStories.includes(story.id_historia)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                          }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedStories.includes(story.id_historia)
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                            }`}
                        >
                          {selectedStories.includes(story.id_historia) ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="flex-1 text-sm text-gray-700">{story.descripcion}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={openRejectModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  No Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => setShowManagerModal(false)}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprobar Historias
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal Detalle de Rechazo/Devolución (Líder) */}
      <Modal isOpen={showLeaderRejectModal} onClose={() => setShowLeaderRejectModal(false)} title="Detalle de Historia" size="large">
        {rejectDetail && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 -m-6 mb-6 p-6 rounded-t-lg">
              <h3 className="text-xl font-bold text-white mb-1">{rejectDetail.project.nombre?.toUpperCase()}</h3>
              <p className="text-red-100">Resultado del gerente: {rejectDetail.approval?.estado || "rechazado"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700"><span className="font-medium">Historia:</span> {rejectDetail.story?.descripcion || rejectDetail.story?.id_historia}</div>
              <div className="text-sm text-gray-700"><span className="font-medium">Gerente:</span> {rejectDetail.manager?.nombre || rejectDetail.approval?.id_gerente}</div>
              <div className="col-span-2">
                <label className="block mb-2 text-sm font-semibold text-gray-700">Comentario</label>
                <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg text-sm text-red-800">
                  {rejectDetail.approval?.comentario || "Sin comentario"}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-100">
              <button type="button" onClick={() => setShowLeaderRejectModal(false)} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Rechazar Progreso">
        <div className="space-y-5">
          {/* Advertencia */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">¡Atención!</h4>
              <p className="text-sm text-red-700">
                Al rechazar el progreso, las historias en revisión volverán a estado pendiente.
                El líder del proyecto deberá volver a enviar las evidencias.
              </p>
            </div>
          </div>

          {/* Información del proyecto */}
          {selectedProject && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Proyecto: {selectedProject.nombre}</h4>
              <p className="text-sm text-gray-600">
                Historias a rechazar: {userStories.filter((s) => s.estado_historia === "en_revision").length}
              </p>
            </div>
          )}

          {/* Razón del rechazo */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Razón del Rechazo *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explique por qué está rechazando este progreso..."
              rows="4"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm resize-none"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Esta información será enviada al líder del proyecto
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRejectProgress}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Confirmar Rechazo
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </div>
  )
}

export default TrackingModule
