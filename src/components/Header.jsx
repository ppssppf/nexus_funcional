"use client"

import { useAuth } from "../contexts/AuthContext"
import { LogOut, User, Shield, Bell, CheckCircle2, RotateCcw, XCircle, Clock, Sparkles, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { proyectosAPI, aprobacionesAPI, aprobacionesHistoriaAPI, historiasAPI, evidenciasAPI } from "../lib/api"
import { supabase } from "../lib/supabase"

export const Header = () => {
  const { currentUser, logout, isManager } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [projectIds, setProjectIds] = useState([])
  const [histMap, setHistMap] = useState(new Map())
  const readKey = currentUser ? `mvmNexusRead_${currentUser.id_usuario}` : null

  const getReadSet = () => {
    if (!readKey) return new Set()
    try {
      const raw = sessionStorage.getItem(readKey)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  }

  const setReadSet = (set) => {
    if (!readKey) return
    sessionStorage.setItem(readKey, JSON.stringify([...set]))
  }

  const refreshNotifications = async () => {
    if (!currentUser) return
    const items = []
    if (isManager) {
      const projects = await proyectosAPI.getAll()
      const pending = projects.filter((p) => p.estado_proyecto === "pendiente")
      for (const p of pending) {
        items.push({ id: `p_${p.id_proyecto}`, projectId: p.id_proyecto, text: `Nuevo proyecto pendiente: ${p.nombre}`, ts: p.fecha_creacion || new Date().toISOString(), type: "pendiente" })
      }
      const evidences = await evidenciasAPI.getAll()
      const historias = await historiasAPI.getAll()
      const histToProj = new Map(historias.map((h) => [h.id_historia, h.id_proyecto]))
      for (const ev of evidences) {
        const pid = histToProj.get(ev.id_historia)
        const proj = projects.find((pp) => pp.id_proyecto === pid)
        items.push({ id: `e_${ev.id_evidencia}`, projectId: pid, text: `Nueva evidencia en ${proj?.nombre || pid}`, ts: ev.fecha_subida || new Date().toISOString(), type: "evidencia" })
      }
    } else {
      const projects = await proyectosAPI.getByLeader(currentUser.id_usuario)
      const pids = projects.map((p) => p.id_proyecto)
      const approvals = await aprobacionesAPI.getAll()
      for (const ap of approvals) {
        if (pids.includes(ap.id_proyecto)) {
          const proj = projects.find((p) => p.id_proyecto === ap.id_proyecto)
          let label = ap.estado_asignado === "aprobado" ? "Proyecto aprobado" : ap.estado_asignado === "devuelto" ? "Proyecto devuelto" : ap.estado_asignado === "rechazado" ? "Proyecto no aprobado" : `Estado: ${ap.estado_asignado}`
          items.push({ id: `ap_${ap.id_aprobacion || ap.id_aprobacion_proyecto || `${ap.id_proyecto}_${ap.fecha_aprobacion}`}`, projectId: ap.id_proyecto, text: `${label}: ${proj?.nombre || ap.id_proyecto}`, ts: ap.fecha_aprobacion || new Date().toISOString(), type: ap.estado_asignado })
        }
      }
      const historias = await historiasAPI.getAll()
      const myHist = historias.filter((h) => pids.includes(h.id_proyecto))
      const histIds = new Set(myHist.map((h) => h.id_historia))
      const storyApprovals = await aprobacionesHistoriaAPI.getAll()
      for (const ah of storyApprovals) {
        if (!histIds.has(ah.id_historia)) continue
        const story = myHist.find((h) => h.id_historia === ah.id_historia)
        const proj = projects.find((p) => p.id_proyecto === story?.id_proyecto)
        if (ah.estado === "aprobado") {
          items.push({ id: `ah_${ah.id_aprobacion_historia || `${ah.id_historia}_${ah.fecha}`}`, projectId: story?.id_proyecto, historyId: ah.id_historia, text: `Historia aprobada en ${proj?.nombre || story?.id_proyecto}`, ts: ah.fecha || new Date().toISOString(), type: "historia" })
        } else if (ah.estado === "rechazado") {
          items.push({ id: `ah_${ah.id_aprobacion_historia || `${ah.id_historia}_${ah.fecha}`}`, projectId: story?.id_proyecto, historyId: ah.id_historia, text: `Historia rechazada en ${proj?.nombre || story?.id_proyecto}`, ts: ah.fecha || new Date().toISOString(), type: "rechazado" })
        }
      }
      const inReview = projects.filter((p) => p.estado_proyecto === "en-revision")
      for (const p of inReview) {
        items.push({ id: `rev_${p.id_proyecto}`, text: `Proyecto en revisión: ${p.nombre || p.id_proyecto}`, ts: new Date().toISOString(), type: "pendiente" })
      }
    }
    items.sort((a, b) => new Date(b.ts) - new Date(a.ts))
    const byId = new Map()
    for (const it of [...items, ...notifications]) byId.set(it.id, it)
    const merged = Array.from(byId.values()).sort((a, b) => new Date(b.ts) - new Date(a.ts))
    setNotifications(merged)
    const read = getReadSet()
    setUnread(merged.filter((it) => !read.has(it.id)).length)
  }

  useEffect(() => {
    let i
    refreshNotifications()
    i = setInterval(refreshNotifications, 5000)
    return () => {
      if (i) clearInterval(i)
    }
  }, [currentUser, isManager])

  useEffect(() => {
    if (!currentUser) return
    const init = async () => {
      if (!isManager) {
        const ps = await proyectosAPI.getByLeader(currentUser.id_usuario)
        setProjectIds(ps.map((p) => p.id_proyecto))
      }
      const hs = await historiasAPI.getAll()
      setHistMap(new Map(hs.map((h) => [h.id_historia, h.id_proyecto])))
    }
    init()
  }, [currentUser, isManager])

  useEffect(() => {
    if (!currentUser) return
    const ch = supabase.channel(`nexus-live-${currentUser.id_usuario}`)
    const pushItem = (item) => {
      setNotifications((prev) => {
        const m = new Map(prev.map((x) => [x.id, x]))
        m.set(item.id, item)
        const merged = Array.from(m.values()).sort((a, b) => new Date(b.ts) - new Date(a.ts))
        const read = getReadSet()
        setUnread(merged.filter((it) => !read.has(it.id)).length)
        return merged
      })
    }
    if (isManager) {
      ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "proyecto" }, (payload) => {
        const p = payload.new
        if (p?.estado_proyecto === "pendiente") {
          const item = { id: `p_${p.id_proyecto}`, text: `Nuevo proyecto pendiente: ${p.nombre}`, ts: p.fecha_creacion || new Date().toISOString(), type: "pendiente" }
          const read = getReadSet()
          if (!read.has(item.id)) pushItem(item)
        }
      })
      ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "evidencia" }, (payload) => {
        const ev = payload.new
        const pid = histMap.get(ev.id_historia)
        const item = { id: `e_${ev.id_evidencia}`, text: `Nueva evidencia en ${pid || ev.id_historia}`, ts: ev.fecha_subida || new Date().toISOString(), type: "evidencia" }
        const read = getReadSet()
        if (!read.has(item.id)) pushItem(item)
      })
    } else {
      ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "aprobacion_proyecto" }, (payload) => {
        const ap = payload.new
        if (projectIds.includes(ap.id_proyecto)) {
          const label = ap.estado_asignado === "aprobado" ? "Proyecto aprobado" : ap.estado_asignado === "devuelto" ? "Proyecto devuelto" : ap.estado_asignado === "rechazado" ? "Proyecto no aprobado" : `Estado: ${ap.estado_asignado}`
          const item = { id: `ap_${ap.id_aprobacion || `${ap.id_proyecto}_${ap.fecha_aprobacion}`}`, projectId: ap.id_proyecto, text: `${label}: ${ap.id_proyecto}`, ts: ap.fecha_aprobacion || new Date().toISOString(), type: ap.estado_asignado }
          const read = getReadSet()
          if (!read.has(item.id)) pushItem(item)
        }
      })
      ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "aprobacion_historia" }, (payload) => {
        const ah = payload.new
        const pid = histMap.get(ah.id_historia)
        if (pid && projectIds.includes(pid)) {
          if (ah.estado === "aprobado") {
            const item = { id: `ah_${ah.id_aprobacion_historia || `${ah.id_historia}_${ah.fecha}`}`, projectId: pid, historyId: ah.id_historia, text: `Historia aprobada en ${pid}`, ts: ah.fecha || new Date().toISOString(), type: "historia" }
            const read = getReadSet()
            if (!read.has(item.id)) pushItem(item)
          } else if (ah.estado === "rechazado") {
            const item = { id: `ah_${ah.id_aprobacion_historia || `${ah.id_historia}_${ah.fecha}`}`, projectId: pid, historyId: ah.id_historia, text: `Historia rechazada en ${pid}`, ts: ah.fecha || new Date().toISOString(), type: "rechazado" }
            const read = getReadSet()
            if (!read.has(item.id)) pushItem(item)
          }
        }
      })
      ch.on("postgres_changes", { event: "UPDATE", schema: "public", table: "proyecto" }, (payload) => {
        const np = payload.new
        if (projectIds.includes(np.id_proyecto) && np.estado_proyecto === "en-revision") {
          const item = { id: `rev_${np.id_proyecto}`, projectId: np.id_proyecto, text: `Proyecto en revisión: ${np.id_proyecto}`, ts: new Date().toISOString(), type: "pendiente" }
          const read = getReadSet()
          if (!read.has(item.id)) pushItem(item)
        }
      })
    }
    ch.subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [currentUser, isManager, projectIds, histMap])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
  }

  useEffect(() => {
    const handler = (e) => {
      if (!open) return
      const el = dropdownRef.current
      if (el && !el.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markAllSeen = () => {
    const read = getReadSet()
    notifications.forEach((n) => read.add(n.id))
    setReadSet(read)
    setUnread(0)
    setOpen(false)
  }

  const markOneSeen = (notif) => {
    const read = getReadSet()
    if (!read.has(notif.id)) {
      read.add(notif.id)
      setReadSet(read)
      setUnread((c) => Math.max(0, c - 1))
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
      const mapTarget = () => {
        if (isManager) {
          if (notif.type === "pendiente") return { module: "approval", target: "approvalDetail" }
          if (notif.type === "evidencia") return { module: "tracking", target: "trackingReview" }
          return { module: "approval", target: "approvalDetail" }
        } else {
          if (["aprobado", "devuelto"].includes(notif.type) && String(notif.id || "").startsWith("ap_")) return { module: "projects", target: "projectsDetail" }
          if (["rechazado"].includes(notif.type) && String(notif.id || "").startsWith("ah_")) return { module: "tracking", target: "leaderReject" }
          if (notif.type === "historia") return { module: "tracking", target: "trackingReview" }
          if (notif.type === "pendiente") return { module: "projects", target: "projectsDetail" }
          return { module: "projects", target: "projectsDetail" }
        }
      }
      const target = mapTarget()
      if (target && notif.projectId) {
        window.dispatchEvent(
          new CustomEvent("nexus:navigate", { detail: { module: target.module, projectId: notif.projectId, target: target.target, historyId: notif.historyId } }),
        )
      }
    }
  }

  return (
    <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 border-b border-white/10 shadow-lg sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Título - Ya no es necesario porque está en el sidebar */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {currentUser?.nombre
                  ?.toLowerCase()
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button onClick={toggleOpen} className="relative p-2 rounded-lg hover:bg-white/10 text-purple-100 hover:text-white transition-colors" title="Notificaciones">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Actividad</span>
                    <span className="text-xs text-gray-400">{isManager ? "Gerente" : "Líder"}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.filter((n)=>!getReadSet().has(n.id)).length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        No hay actividad nueva
                      </div>
                    ) : (
                      notifications.filter((n)=>!getReadSet().has(n.id)).slice(0, 10).map((n) => (
                        <div key={n.id} onClick={()=>markOneSeen(n)} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                          {n.type === "aprobado" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          {n.type === "devuelto" && <RotateCcw className="w-4 h-4 text-orange-600" />}
                          {n.type === "rechazado" && <XCircle className="w-4 h-4 text-red-600" />}
                          {n.type === "pendiente" && <Clock className="w-4 h-4 text-amber-600" />}
                          {n.type === "evidencia" && <Upload className="w-4 h-4 text-blue-600" />}
                          {n.type === "historia" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          <span className="text-sm text-gray-700">{n.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button onClick={markAllSeen} className="w-full text-xs font-semibold text-purple-600 hover:text-purple-700">
                        Marcar todo como leído
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Badge de rol */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
              {isManager ? (
                <Shield className="w-4 h-4 text-purple-300" />
              ) : (
                <User className="w-4 h-4 text-blue-300" />
              )}
              <span className="text-sm font-medium text-white">
                {isManager ? "Gerente" : "Líder de Proyecto"}
              </span>
            </div>

            {/* Botón de Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-purple-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
