// import { getHeaders } from "./supabase"

// const BASE_URL = import.meta.env.VITE_SUPABASE_URL

// const handleResponse = async (response) => {
//   // Si la respuesta no es OK, lanzar error con detalles
//   if (!response.ok) {
//     let errorMessage = `Error ${response.status}: ${response.statusText}`
//     try {
//       const errorData = await response.json()
//       errorMessage = errorData.message || errorData.hint || errorMessage
//     } catch {
//       // Si no hay JSON, usar el mensaje por defecto
//     }
//     throw new Error(errorMessage)
//   }

//   // Si es un DELETE o no hay contenido, retornar true
//   if (response.status === 204 || response.headers.get("content-length") === "0") {
//     return true
//   }

//   // Intentar parsear JSON
//   try {
//     return await response.json()
//   } catch {
//     return true // Si no hay JSON, la operación fue exitosa
//   }
// }

// const getHeadersWithReturn = () => ({
//   ...getHeaders(),
//   Prefer: "return=representation",
// })

// // Usuarios
// export const usuariosAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/usuario`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getById: async (id) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
//       headers: getHeaders(),
//     })
//     const data = await handleResponse(response)
//     return data[0]
//   },

//   create: async (usuario) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/usuario`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(usuario),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   update: async (id, usuario) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
//       method: "PATCH",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(usuario),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   delete: async (id) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
//       method: "DELETE",
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   login: async (email, contraseña) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/usuario?email=eq.${email}&contraseña=eq.${contraseña}`, {
//       headers: getHeaders(),
//     })
//     const data = await handleResponse(response)
//     return data[0]
//   },
// }

// // Proyectos
// export const proyectosAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/proyecto`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getById: async (id) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
//       headers: getHeaders(),
//     })
//     const data = await handleResponse(response)
//     return data[0]
//   },

//   getByLeader: async (leaderId) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_lider=eq.${leaderId}`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   create: async (proyecto) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/proyecto`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(proyecto),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   update: async (id, proyecto) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
//       method: "PATCH",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(proyecto),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   delete: async (id) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
//       method: "DELETE",
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },
// }

// // Historias de Usuario
// export const historiasAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getByProject: async (projectId) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_proyecto=eq.${projectId}`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   create: async (historia) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(historia),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   update: async (id, historia) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_historia=eq.${id}`, {
//       method: "PATCH",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(historia),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   delete: async (id) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_historia=eq.${id}`, {
//       method: "DELETE",
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },
// }

// // Aprobaciones de Proyecto
// export const aprobacionesAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getByProject: async (projectId) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_proyecto=eq.${projectId}`, {
//       headers: getHeaders(),
//     })
//     const data = await handleResponse(response)
//     return data[0]
//   },

//   create: async (aprobacion) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(aprobacion),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   update: async (id, aprobacion) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_aprobacion=eq.${id}`, {
//       method: "PATCH",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(aprobacion),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },
// }

// // Aprobaciones de Historia
// export const aprobacionesHistoriaAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getByHistory: async (historiaId) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia?id_historia=eq.${historiaId}`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   create: async (aprobacion) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(aprobacion),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },

//   update: async (id, aprobacion) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia?id_aprobacion_historia=eq.${id}`, {
//       method: "PATCH",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(aprobacion),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },
// }

// // Evidencias
// export const evidenciasAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/evidencia`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getByHistory: async (historiaId) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/evidencia?id_historia=eq.${historiaId}`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   create: async (evidencia) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/evidencia`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(evidencia),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },
// }

// // Empresas
// export const empresasAPI = {
//   getAll: async () => {
//     const response = await fetch(`${BASE_URL}/rest/v1/empresa`, {
//       headers: getHeaders(),
//     })
//     return handleResponse(response)
//   },

//   getById: async (id) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/empresa?id_empresa=eq.${id}`, {
//       headers: getHeaders(),
//     })
//     const data = await handleResponse(response)
//     return data[0]
//   },

//   create: async (empresa) => {
//     const response = await fetch(`${BASE_URL}/rest/v1/empresa`, {
//       method: "POST",
//       headers: getHeadersWithReturn(),
//       body: JSON.stringify(empresa),
//     })
//     const data = await handleResponse(response)
//     return Array.isArray(data) ? data[0] : data
//   },
// }


import { getHeaders } from "./supabase"

const BASE_URL = import.meta.env.VITE_SUPABASE_URL

const handleResponse = async (response) => {
  // Si la respuesta no es OK, lanzar error con detalles
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.hint || errorMessage
    } catch {
      // Si no hay JSON, usar el mensaje por defecto
    }
    throw new Error(errorMessage)
  }

  // Si es un DELETE o no hay contenido, retornar true
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return true
  }

  // Intentar parsear JSON
  try {
    return await response.json()
  } catch {
    return true // Si no hay JSON, la operación fue exitosa
  }
}

const getHeadersWithReturn = () => ({
  ...getHeaders(),
  Prefer: "return=representation",
})

// Usuarios
export const usuariosAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
      headers: getHeaders(),
    })
    const data = await handleResponse(response)
    return data[0]
  },

  create: async (usuario) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(usuario),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  update: async (id, usuario) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
      method: "PATCH",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(usuario),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?id_usuario=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  login: async (email, contraseña) => {
    const response = await fetch(`${BASE_URL}/rest/v1/usuario?email=eq.${email}&contraseña=eq.${contraseña}`, {
      headers: getHeaders(),
    })
    const data = await handleResponse(response)
    return data[0]
  },
}

// Proyectos
export const proyectosAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
      headers: getHeaders(),
    })
    const data = await handleResponse(response)
    return data[0]
  },

  getByLeader: async (leaderId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_lider=eq.${leaderId}`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  create: async (proyecto) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(proyecto),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  update: async (id, proyecto) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
      method: "PATCH",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(proyecto),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/proyecto?id_proyecto=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return handleResponse(response)
  },
}

// Historias de Usuario
export const historiasAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getByProject: async (projectId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_proyecto=eq.${projectId}`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  create: async (historia) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(historia),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  update: async (id, historia) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_historia=eq.${id}`, {
      method: "PATCH",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(historia),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/historia_usuario?id_historia=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return handleResponse(response)
  },
}

// Aprobaciones de Proyecto
export const aprobacionesAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getByProject: async (projectId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_proyecto=eq.${projectId}`, {
      headers: getHeaders(),
    })
    const data = await handleResponse(response)
    // Always return an array to avoid .length errors
    return Array.isArray(data) ? data : []
  },

  create: async (aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(aprobacion),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  update: async (id, aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_aprobacion=eq.${id}`, {
      method: "PATCH",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(aprobacion),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_proyecto?id_aprobacion=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    return handleResponse(response)
  },
}

// Aprobaciones de Historia
export const aprobacionesHistoriaAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getByHistory: async (historiaId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia?id_historia=eq.${historiaId}`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  create: async (aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(aprobacion),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },

  update: async (id, aprobacion) => {
    const response = await fetch(`${BASE_URL}/rest/v1/aprobacion_historia?id_aprobacion_historia=eq.${id}`, {
      method: "PATCH",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(aprobacion),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },
}

// Evidencias
export const evidenciasAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/evidencia`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getByHistory: async (historiaId) => {
    const response = await fetch(`${BASE_URL}/rest/v1/evidencia?id_historia=eq.${historiaId}`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  create: async (evidencia) => {
    const response = await fetch(`${BASE_URL}/rest/v1/evidencia`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(evidencia),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },
}

// Empresas
export const empresasAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/rest/v1/empresa`, {
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/rest/v1/empresa?id_empresa=eq.${id}`, {
      headers: getHeaders(),
    })
    const data = await handleResponse(response)
    return data[0]
  },

  create: async (empresa) => {
    const response = await fetch(`${BASE_URL}/rest/v1/empresa`, {
      method: "POST",
      headers: getHeadersWithReturn(),
      body: JSON.stringify(empresa),
    })
    const data = await handleResponse(response)
    return Array.isArray(data) ? data[0] : data
  },
}
