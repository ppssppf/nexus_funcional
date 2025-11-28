"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { proyectosAPI, historiasAPI, aprobacionesAPI } from "../../lib/api"
import { Modal } from "../Modal"
import { Button } from "../Button"

export const ApprovalModule = ({ onShowToast }) => {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [incentive, setIncentive] = useState("")

  useEffect(() => {
    loadPendingProjects()
  }, [])

  const loadPendingProjects = async () => {
    try {
      setLoading(true)
      const data = await proyectosAPI.getAll()
      const pending = data.filter((p) => p.estado_proyecto === "pendiente" || p.estado_proyecto === "en-revision")
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

    // Update status to "en-revision"
    if (project.estado_proyecto === "pendiente") {
      await proyectosAPI.update(project.id_proyecto, {
        estado_proyecto: "en-revision",
      })
      loadPendingProjects()
    }

    // Load user stories
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
      onShowToast("Debe seleccionar un incentivo", "error")
      return
    }

    try {
      // Update project status
      await proyectosAPI.update(selectedProject.id_proyecto, {
        estado_proyecto: "aprobado",
      })

      // Create approval record
      await aprobacionesAPI.create({
        id_proyecto: selectedProject.id_proyecto,
        id_aprobador: currentUser.id_usuario,
        estado_aprobacion: "aprobado",
        incentivo: incentive,
        comentarios: "",
      })

      onShowToast(`Proyecto "${selectedProject.nombre_proyecto}" aprobado con éxito`, "success")
      closeModal()
      loadPendingProjects()
    } catch (error) {
      console.error("Error approving project:", error)
      onShowToast("Error al aprobar proyecto", "error")
    }
  }

  const returnProject = async () => {
    try {
      await proyectosAPI.update(selectedProject.id_proyecto, {
        estado_proyecto: "devuelto",
      })

      await aprobacionesAPI.create({
        id_proyecto: selectedProject.id_proyecto,
        id_aprobador: currentUser.id_usuario,
        estado_aprobacion: "devuelto",
        comentarios: "Proyecto devuelto para mejoras",
      })

      onShowToast("Proyecto devuelto al líder para mejoras", "info")
      closeModal()
      loadPendingProjects()
    } catch (error) {
      console.error("Error returning project:", error)
      onShowToast("Error al devolver proyecto", "error")
    }
  }

  const rejectProject = async () => {
    if (confirm("¿Está seguro de NO APROBAR este proyecto? Esta acción es permanente.")) {
      try {
        await proyectosAPI.update(selectedProject.id_proyecto, {
          estado_proyecto: "no-aprobado",
        })

        await aprobacionesAPI.create({
          id_proyecto: selectedProject.id_proyecto,
          id_aprobador: currentUser.id_usuario,
          estado_aprobacion: "rechazado",
          comentarios: "Proyecto no aprobado",
        })

        onShowToast("Proyecto NO aprobado", "error")
        closeModal()
        loadPendingProjects()
      } catch (error) {
        console.error("Error rejecting project:", error)
        onShowToast("Error al rechazar proyecto", "error")
      }
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

  if (loading) {
    return <div className="text-center py-8">Cargando proyectos pendientes...</div>
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-4xl font-bold text-blue-600">Proyectos Pendientes de Aprobación</h2>
        <p className="text-gray-600 mt-2">Departamento de Innovación Tecnológica</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <h3 className="text-2xl mb-2 text-gray-400">No hay proyectos pendientes</h3>
          <p>Todos los proyectos han sido revisados</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id_proyecto}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-start gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{project.nombre_proyecto}</h3>
                    {project.estado_proyecto === "en-revision" && (
                      <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-semibold">
                        En Revisión
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{project.descripcion}</p>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <strong className="text-gray-700">Empresa:</strong>
                      <span className="text-gray-600">{project.empresa}</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-gray-700">Nivel de IA:</strong>
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
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
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-gray-700">Período:</strong>
                      <span className="text-gray-600">
                        {project.fecha_inicio} → {project.fecha_fin}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Button onClick={() => openModal(project)} className="w-full">
                    Revisar Proyecto
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Revisar Proyecto" size="large">
        {selectedProject && (
          <>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="text-xl font-bold text-blue-600 mb-4">{selectedProject.nombre_proyecto}</h4>
              <p className="text-gray-700 mb-4">{selectedProject.descripcion}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <strong>Empresa:</strong> {selectedProject.empresa}
                </div>
                <div>
                  <strong>IA:</strong> {getAILevelLabel(selectedProject.nivel_ia)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <strong className="block mb-2 text-gray-700">Historias de Usuario:</strong>
                <ul className="space-y-2">
                  {userStories.map((story) => (
                    <li key={story.id_historia} className="px-4 py-2 bg-white border border-gray-200 rounded text-sm">
                      {story.descripcion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <form onSubmit={approveProject} className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-700 font-semibold">Incentivo Asignado *</label>
                <select
                  value={incentive}
                  onChange={(e) => setIncentive(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                >
                  <option value="">Seleccionar incentivo...</option>
                  <option value="economico">Incentivo Económico</option>
                  <option value="laboral">Incentivo Laboral</option>
                  <option value="temporal">Incentivo Temporal</option>
                  <option value="formacion">Formación Especializada</option>
                  <option value="recursos">Recursos Adicionales</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t-2 border-gray-200">
                <Button type="button" variant="secondary" onClick={returnProject}>
                  Devolver
                </Button>
                <Button type="button" variant="danger" onClick={rejectProject}>
                  No Aprobar
                </Button>
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit">Aprobar Proyecto</Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  )
}
