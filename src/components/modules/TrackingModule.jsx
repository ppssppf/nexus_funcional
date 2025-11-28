"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI, aprobacionesHistoriaAPI, evidenciasAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Button } from "../Button"

export const TrackingModule = ({ onShowToast }) => {
  const { currentUser, isManager } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLeaderModal, setShowLeaderModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [selectedStories, setSelectedStories] = useState([])
  const [evidenceFile, setEvidenceFile] = useState(null)

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
    } catch (error) {
      console.error("Error loading projects:", error)
      onShowToast("Error al cargar proyectos", "error")
    } finally {
      setLoading(false)
    }
  }

  const openLeaderModal = async (project) => {
    setSelectedProject(project)
    const stories = await historiasAPI.getByProject(project.id_proyecto)
    setUserStories(stories)
    setSelectedStories([])
    setEvidenceFile(null)
    setShowLeaderModal(true)
  }

  const openManagerModal = async (project) => {
    setSelectedProject(project)
    const stories = await historiasAPI.getByProject(project.id_proyecto)
    setUserStories(stories)

    // Pre-select pending approval stories
    const pendingIds = stories.filter((s) => s.pendiente_aprobacion).map((s) => s.id_historia)
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

    try {
      // Update selected stories to pending approval
      for (const storyId of selectedStories) {
        await historiasAPI.update(storyId, {
          completada: true,
          pendiente_aprobacion: true,
        })

        // Create evidence record
        await evidenciasAPI.create({
          id_historia: storyId,
          tipo_evidencia: evidenceFile.name.split(".").pop(),
          nombre_archivo: evidenceFile.name,
          ruta_archivo: `/evidencias/${evidenceFile.name}`,
        })
      }

      onShowToast("Progreso enviado al gerente para aprobación", "success")
      setShowLeaderModal(false)
      loadProjects()
    } catch (error) {
      console.error("Error submitting progress:", error)
      onShowToast("Error al enviar progreso", "error")
    }
  }

  const approveManagerProgress = async (e) => {
    e.preventDefault()

    if (selectedStories.length === 0) {
      onShowToast("Debe seleccionar al menos una historia para aprobar", "error")
      return
    }

    try {
      // Approve selected stories
      for (const storyId of selectedStories) {
        await historiasAPI.update(storyId, {
          aprobada: true,
          pendiente_aprobacion: false,
        })

        await aprobacionesHistoriaAPI.create({
          id_historia: storyId,
          id_aprobador: currentUser.id_usuario,
          estado_aprobacion: "aprobado",
        })
      }

      // Check if all stories are approved
      const allStories = await historiasAPI.getByProject(selectedProject.id_proyecto)
      const allApproved = allStories.every((s) => s.aprobada)

      if (allApproved) {
        await proyectosAPI.update(selectedProject.id_proyecto, {
          estado_proyecto: "completado",
          progreso: 100,
        })
        onShowToast("Proyecto completado: todas las historias han sido aprobadas", "success")
      } else {
        // Update progress
        const approvedCount = allStories.filter((s) => s.aprobada).length
        const progress = Math.round((approvedCount / allStories.length) * 100)
        await proyectosAPI.update(selectedProject.id_proyecto, {
          progreso: progress,
        })
        onShowToast(
          `${selectedStories.length} ${selectedStories.length === 1 ? "historia aprobada" : "historias aprobadas"}`,
          "success",
        )
      }

      setShowManagerModal(false)
      loadProjects()
    } catch (error) {
      console.error("Error approving progress:", error)
      onShowToast("Error al aprobar progreso", "error")
    }
  }

  const rejectProgress = async () => {
    if (confirm("¿Está seguro de NO APROBAR este progreso? Las historias volverán a estado pendiente.")) {
      try {
        // Revert stories to not completed
        const pendingStories = userStories.filter((s) => s.pendiente_aprobacion)

        for (const story of pendingStories) {
          await historiasAPI.update(story.id_historia, {
            completada: false,
            pendiente_aprobacion: false,
          })
        }

        onShowToast("Progreso no aprobado. Las historias han vuelto a estado pendiente.", "error")
        setShowManagerModal(false)
        loadProjects()
      } catch (error) {
        console.error("Error rejecting progress:", error)
        onShowToast("Error al rechazar progreso", "error")
      }
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
    return <div className="text-center py-8">Cargando proyectos...</div>
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-4xl font-bold text-blue-600">Seguimiento de Proyectos</h2>
        <p className="text-gray-600 mt-2">Monitoreo de progreso</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <h3 className="text-2xl mb-2 text-gray-400">No hay proyectos en seguimiento</h3>
          <p>Los proyectos aprobados aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const approvedCount = userStories.filter((s) => s.id_proyecto === project.id_proyecto && s.aprobada).length
            const pendingCount = userStories.filter(
              (s) => s.id_proyecto === project.id_proyecto && s.pendiente_aprobacion,
            ).length
            const progress = project.progreso || 0

            return (
              <div
                key={project.id_proyecto}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{project.nombre_proyecto}</h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex gap-2">
                        <strong className="text-gray-700">Empresa:</strong>
                        <span className="text-gray-600">{project.empresa}</span>
                      </div>
                      <div className="flex gap-2">
                        <strong className="text-gray-700">Período:</strong>
                        <span className="text-gray-600">
                          {project.fecha_inicio} → {project.fecha_fin}
                        </span>
                      </div>
                      {pendingCount > 0 && (
                        <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <strong className="text-yellow-800">⏳ Historias pendientes de aprobación:</strong>{" "}
                          <span className="text-yellow-800 font-semibold">{pendingCount}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="bg-gray-200 h-6 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-end px-2 text-white text-sm font-semibold transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        >
                          {progress}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {isManager && pendingCount > 0 ? (
                      <Button onClick={() => openManagerModal(project)} className="w-full">
                        Aprobar Progreso ({pendingCount})
                      </Button>
                    ) : !isManager ? (
                      <Button onClick={() => openLeaderModal(project)} className="w-full">
                        Actualizar Progreso
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leader Progress Modal */}
      <Modal
        isOpen={showLeaderModal}
        onClose={() => setShowLeaderModal(false)}
        title="Actualizar Progreso del Proyecto"
      >
        {selectedProject && (
          <>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="text-xl font-bold text-blue-600 mb-2">{selectedProject.nombre_proyecto}</h4>
              <p className="text-gray-700">Seleccione las historias completadas</p>
            </div>

            <form onSubmit={submitLeaderProgress} className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-700 font-semibold">Historias de Usuario Completadas</label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto space-y-2">
                  {userStories.map((story) => (
                    <div
                      key={story.id_historia}
                      className={`flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-lg transition-all ${
                        story.aprobada
                          ? "border-gray-300 opacity-60 bg-gray-50"
                          : story.pendiente_aprobacion
                            ? "border-gray-300 opacity-60 bg-gray-50"
                            : "border-gray-200 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`story-${story.id_historia}`}
                        checked={
                          story.aprobada || story.pendiente_aprobacion || selectedStories.includes(story.id_historia)
                        }
                        onChange={() => toggleStory(story.id_historia)}
                        disabled={story.aprobada || story.pendiente_aprobacion}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <label htmlFor={`story-${story.id_historia}`} className="flex-1 cursor-pointer">
                        {story.descripcion}
                        {story.aprobada && <em className="text-green-600 ml-2">(Aprobada)</em>}
                        {story.pendiente_aprobacion && (
                          <em className="text-yellow-600 ml-2">(Pendiente de aprobación)</em>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-semibold">Archivo de Evidencia *</label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceFile(e.target.files[0])}
                  required
                  accept=".pdf,.xls,.xlsx"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <small className="block mt-2 text-gray-600">
                  Solo se aceptan archivos Excel (.xls, .xlsx) y PDF (.pdf)
                </small>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t-2 border-gray-200">
                <Button type="button" variant="secondary" onClick={() => setShowLeaderModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Enviar Progreso</Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Manager Progress Modal */}
      <Modal isOpen={showManagerModal} onClose={() => setShowManagerModal(false)} title="Aprobar Progreso del Proyecto">
        {selectedProject && (
          <>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="text-xl font-bold text-blue-600 mb-2">{selectedProject.nombre_proyecto}</h4>
              <p className="text-gray-700">
                <strong>{userStories.filter((s) => s.pendiente_aprobacion).length}</strong> historias pendientes de
                aprobación
              </p>
            </div>

            <form onSubmit={approveManagerProgress} className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-700 font-semibold">
                  Historias de Usuario Pendientes de Aprobación
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto space-y-2">
                  {userStories
                    .filter((s) => s.pendiente_aprobacion)
                    .map((story) => (
                      <div
                        key={story.id_historia}
                        className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          id={`story-mgr-${story.id_historia}`}
                          checked={selectedStories.includes(story.id_historia)}
                          onChange={() => toggleStory(story.id_historia)}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor={`story-mgr-${story.id_historia}`} className="flex-1 cursor-pointer">
                          {story.descripcion}
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t-2 border-gray-200">
                <Button type="button" variant="danger" onClick={rejectProgress}>
                  No Aprobar
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowManagerModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Aprobar Historias</Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  )
}
