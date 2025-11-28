import { getHeaders } from "./supabase"

const BASE_URL = import.meta.env.VITE_SUPABASE_URL

// Usuarios
export const usuariosAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
      headers: getHeaders(),
    })
    const data = await response.json()
    return data[0]
  },

  create: async (usuario) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(usuario),
    })
    return response.json()
  },

  update: async (id, usuario) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(usuario),
    })
    return response.json()
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return response.ok
  },

  login: async (username, password) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?email=eq.${username}&contraseña=eq.${password}`, {
      headers: getHeaders(),
    })
    const data = await response.json()
    return data[0]
  },
}

// Proyectos
export const proyectosAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
      headers: getHeaders(),
    })
    const data = await response.json()
    return data[0]
  },

  getByLeader: async (leaderId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_lider=eq.${leaderId}`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  create: async (proyecto) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(proyecto),
    })
    return response.json()
  },

  update: async (id, proyecto) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(proyecto),
    })
    return response.json()
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return response.ok
  },
}

// Historias de Usuario
export const historiasAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  getByProject: async (projectId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_proyecto=eq.${projectId}`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  create: async (historia) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(historia),
    })
    return response.json()
  },

  update: async (id, historia) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_historia=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(historia),
    })
    return response.json()
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_historia=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return response.ok
  },
}

// Aprobaciones de Proyecto
export const aprobacionesAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  getByProject: async (projectId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_proyecto=eq.${projectId}`, {
      headers: getHeaders(),
    })
    const data = await response.json()
    return data[0]
  },

  create: async (aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(aprobacion),
    })
    return response.json()
  },

  update: async (id, aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_aprobacion=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(aprobacion),
    })
    return response.json()
  },
}

// Aprobaciones de Historia
export const aprobacionesHistoriaAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  getByHistory: async (historiaId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia?id_historia=eq.${historiaId}`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  create: async (aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(aprobacion),
    })
    return response.json()
  },

  update: async (id, aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia?id_aprobacion_historia=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(aprobacion),
    })
    return response.json()
  },
}

// Evidencias
export const evidenciasAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/evidencia`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  getByHistory: async (historiaId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/evidencia?id_historia=eq.${historiaId}`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  create: async (evidencia) => {
    const response = await fetch(`${BASE_URL}/rest/v1/evidencia`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(evidencia),
    })
    return response.json()
  },
}

// Empresas
export const empresasAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/empresa`, {
      headers: getHeaders(),
    })
    return response.json()
  },

  create: async (empresa) => {
    const response = await fetch(`${BASE_URL}/rest/v1/empresa`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(empresa),
    })
    return response.json()
  },
}
