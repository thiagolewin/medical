import { config } from "./config"
import { patientAuthUtils } from "./patient-auth"

// Configuración de la API para pacientes
const API_BASE_URL = config.API_BASE_URL

// Headers comunes para todas las peticiones de pacientes
const getPatientHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  }

  // Agregar token de autenticación del paciente si existe
  const token = patientAuthUtils.getPatientToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Funciones para manejar errores de la API
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    } catch (e) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
  }

  const contentLength = response.headers.get("content-length")
  if (contentLength === "0") {
    return null
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

// API para autenticación de pacientes
export const patientAuthApi = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/login`, {
        method: "POST",
        headers: getPatientHeaders(),
        body: JSON.stringify(credentials),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error en login de paciente:", error)
      throw error
    }
  },

  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/profile`, {
        method: "GET",
        headers: getPatientHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo perfil del paciente:", error)
      throw error
    }
  },

  updateProfile: async (profileData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/profile`, {
        method: "PUT",
        headers: getPatientHeaders(),
        body: JSON.stringify(profileData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando perfil del paciente:", error)
      throw error
    }
  },
}

// API para protocolos del paciente
export const patientProtocolApi = {
  getMyProtocols: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/protocols`, {
        method: "GET",
        headers: getPatientHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo protocolos del paciente:", error)
      throw error
    }
  },

  getProtocolForms: async (protocolId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/protocols/${protocolId}/forms`, {
        method: "GET",
        headers: getPatientHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formularios del protocolo:", error)
      throw error
    }
  },
}

// API para formularios del paciente
export const patientFormApi = {
  getForm: async (formId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/forms/${formId}`, {
        method: "GET",
        headers: getPatientHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formulario:", error)
      throw error
    }
  },

  submitForm: async (formId: number, responses: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/forms/${formId}/submit`, {
        method: "POST",
        headers: getPatientHeaders(),
        body: JSON.stringify({ responses }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error enviando formulario:", error)
      throw error
    }
  },

  getMySubmissions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/submissions`, {
        method: "GET",
        headers: getPatientHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo envíos del paciente:", error)
      throw error
    }
  },
}
