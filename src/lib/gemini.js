import { GoogleGenAI } from "@google/genai"
import * as XLSX from 'xlsx' // Importación de SheetJS para manejar archivos Excel

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Inicializar el cliente de Gemini
if (!API_KEY) {
  throw new Error("La clave API de Gemini no está configurada en las variables de entorno")
}

const ai = new GoogleGenAI({apiKey: API_KEY})

/**
 * Función auxiliar para convertir Excel a CSV (String)
 * @param {File} file - El objeto File de Excel
 * @returns {Promise<string>} - Contenido del archivo como una cadena CSV
 */
const excelToCsvString = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName])
        resolve(csv)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file) // Leer como ArrayBuffer para XLS/XLSX
  })
}

/**
 * Extrae historias de usuario de un archivo CSV o Excel usando Gemini AI
 * @param {File} file - Archivo CSV o Excel
 * @returns {Promise<Array<string>>} - Array de historias extraídas
 */
export const extractStoriesFromFile = async (file) => {
  try {
    console.log("[v0] Iniciando extracción de historias del archivo:", file.name)

    let fileData
    let mimeTypeToUpload

    // 1. Detección y Conversión de Archivos de Hoja de Cálculo
    if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      console.log("[v0] Archivo Excel detectado, iniciando conversión a CSV...")
      
      // Convertir el contenido del Excel a una CADENA CSV
      const csvString = await excelToCsvString(file)
      
      // Usar btoa() para codificar la cadena de texto a Base64
      fileData = btoa(unescape(encodeURIComponent(csvString))) // Manejo de caracteres especiales
      
      // Establecer el MIME type soportado
      mimeTypeToUpload = "text/csv"
      console.log("[v0] Archivo Excel convertido a CSV. MIME Type:", mimeTypeToUpload)
    } else {
      // Si ya es CSV, TXT, o PDF (formatos soportados)
      fileData = await fileToBase64(file)
      mimeTypeToUpload = file.type || getMimeTypeByExtension(file.name)
      console.log("[v0] Archivo compatible. MIME Type:", mimeTypeToUpload)
    }

    console.log("[v0] Archivo convertido a Base64. Tamaño:", fileData.length)

    // Prompt específico para extraer historias
    const prompt = `Recibirás un archivo en formato Excel o CSV. Tu tarea es leerlo y extraer todas las historias de usuario que contenga. Cada historia debe ser un texto corto y simple que describa una tarea, por ejemplo: "Crear el botón del menú de usuarios".

Devuélveme exclusivamente un JSON con la siguiente estructura:

{
  "historias": [
    "texto historia 1",
    "texto historia 2"
  ]
}

No generes explicaciones, análisis ni texto adicional fuera del JSON.`

    // 3. Llamada a la API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            // Parte 1: El archivo codificado en Base64
            {
              inlineData: {
                data: fileData,
                mimeType: mimeTypeToUpload, // Usar el MIME type correcto
              },
            },
            // Parte 2: El prompt de instrucción
            {
              text: prompt,
            },
          ],
        },
      ],
    })

    console.log("[v0] Respuesta recibida de Gemini")

    const text = response.text

    if (!text) {
      console.error("[v0] Respuesta vacía de Gemini:", response)
      throw new Error("La respuesta de Gemini está vacía")
    }

    console.log("[v0] Texto de respuesta:", text)

    // Parsear la respuesta JSON
    let parsedResponse
    try {
      // Limpiar el texto en caso de que tenga formato markdown (```json ... ```)
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      parsedResponse = JSON.parse(cleanText)
      console.log("[v0] JSON parseado correctamente:", parsedResponse)
    } catch (e) {
      console.error("[v0] Error al parsear JSON:", e)
      console.error("[v0] Texto recibido:", text)
      throw new Error("La respuesta de Gemini no es un JSON válido")
    }

    // Validar que tenga historias
    if (!parsedResponse.historias || !Array.isArray(parsedResponse.historias)) {
      console.error("[v0] Formato inválido de respuesta:", parsedResponse)
      throw new Error("El formato de respuesta no contiene historias válidas")
    }

    // Filtrar historias vacías
    const historias = parsedResponse.historias.filter((h) => h && h.trim().length > 0)

    if (historias.length === 0) {
      throw new Error("No se encontraron historias en el archivo")
    }

    console.log("[v0] Historias extraídas exitosamente:", historias.length)
    return historias
  } catch (error) {
    console.error("[v0] Error al extraer historias con Gemini:", error)
    throw error
  }
}

/**
 * Convierte un archivo a Base64
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} - Archivo en Base64 (sin el prefijo data:)
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      // Remover el prefijo "data:...;base64," para obtener solo el Base64
      const base64 = reader.result.split(",")[1]
      resolve(base64)
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Obtiene el MIME type según la extensión del archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} - MIME type
 */
const getMimeTypeByExtension = (filename) => {
  const extension = filename.split(".").pop().toLowerCase()

  const mimeTypes = {
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
  }

  return mimeTypes[extension] || "application/octet-stream"
}