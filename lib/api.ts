import { ApiError } from "./error-handler"
import { config } from "./config"
import { authUtils } from "./auth"

// Configuración de la API
const API_BASE_URL = config.API_BASE_URL

// Headers comunes para todas las peticiones
const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Para evitar el warning de ngrok
  }

  // Agregar token de autenticación si existe
  const token = authUtils.getToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Funciones para manejar errores de la API
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch (e) {
      // Si no se puede parsear como JSON, usar el mensaje por defecto
    }

    throw new ApiError(errorMessage, response.status)
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

// API para la gestión de usuarios
export const usersApi = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      console.log("usersApi.login - Enviando credenciales:", { username: credentials.username })
      console.log("usersApi.login - URL:", `${API_BASE_URL}/users/login`)

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(credentials),
      })

      console.log("usersApi.login - Response status:", response.status)

      const result = await handleResponse(response)
      console.log("usersApi.login - Result:", result)

      return result
    } catch (error) {
      console.error("Error en usersApi.login:", error)
      throw error
    }
  },

  createUser: async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(userData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando usuario:", error)
      throw error
    }
  },

  getUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo usuarios:", error)
      throw error
    }
  },

  getUser: async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo usuario:", error)
      throw error
    }
  },

  updateUser: async (userId: number, userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(userData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando usuario:", error)
      throw error
    }
  },

  deleteUser: async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error eliminando usuario:", error)
      throw error
    }
  },
}

// API para la gestión de formularios
export const formsApi = {
  getForms: async () => {
    try {
      console.log("Llamando a API: GET /forms")
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "GET",
        headers: getHeaders(),
      })
      console.log("Respuesta de API recibida: GET /forms", response.status)
      const data = await handleResponse(response)
      return data || []
    } catch (error) {
      console.error("Error obteniendo formularios:", error)
      throw error
    }
  },

  getForm: async (formId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formulario:", error)
      throw error
    }
  },

  createForm: async (form: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando formulario:", error)
      throw error
    }
  },

  updateForm: async (formId: number, form: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(form),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando formulario:", error)
      throw error
    }
  },

  deleteForm: async (formId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error eliminando formulario:", error)
      throw error
    }
  },
}

// API para la gestión de preguntas
export const questionsApi = {
  createQuestion: async (question: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(question),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando pregunta:", error)
      throw error
    }
  },

  getQuestionsByForm: async (formId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/form/${formId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo preguntas:", error)
      throw error
    }
  },

  getQuestion: async (questionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo pregunta:", error)
      throw error
    }
  },

  updateQuestion: async (questionId: number, question: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(question),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando pregunta:", error)
      throw error
    }
  },

  deleteQuestion: async (questionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error eliminando pregunta:", error)
      throw error
    }
  },

  addOption: async (questionId: number, option: any) => {
    try {
      console.log(`Agregando opción a pregunta ${questionId}:`, option)
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(option),
      })
      const result = await handleResponse(response)
      console.log(`Opción agregada exitosamente:`, result)
      return result
    } catch (error) {
      console.error("Error agregando opción:", error)
      throw error
    }
  },

  // Nuevo método para obtener opciones de una pregunta
  getQuestionOptions: async (questionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo opciones de pregunta:", error)
      throw error
    }
  },
}

// API para tipos de pregunta
export const questionTypesApi = {
  getQuestionTypes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/question-types`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo tipos de pregunta:", error)
      throw error
    }
  },

  createQuestionType: async (questionType: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/question-types`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(questionType),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando tipo de pregunta:", error)
      throw error
    }
  },
}

// API para nacionalidades
export const nationalitiesApi = {
  getNationalities: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/nationalities`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo nacionalidades:", error)
      throw error
    }
  },
}

// API para la gestión de pacientes
export const patientsApi = {
  getPatients: async () => {
    try {
      console.log("Llamando a API: GET /patients")
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "GET",
        headers: getHeaders(),
      })
      console.log("Respuesta de API recibida: GET /patients", response.status)
      const data = await handleResponse(response)
      return data || []
    } catch (error) {
      console.error("Error obteniendo pacientes:", error)
      throw error
    }
  },

  getPatient: async (patientId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo paciente:", error)
      throw error
    }
  },

  createPatient: async (patient: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(patient),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando paciente:", error)
      throw error
    }
  },

  updatePatient: async (patientId: number, patient: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(patient),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando paciente:", error)
      throw error
    }
  },

  deletePatient: async (patientId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error eliminando paciente:", error)
      throw error
    }
  },
}

// API para la gestión de protocolos
export const protocolsApi = {
  getProtocols: async () => {
    try {
      console.log("Llamando a API: GET /protocols")
      const response = await fetch(`${API_BASE_URL}/protocols`, {
        method: "GET",
        headers: getHeaders(),
      })
      console.log("Respuesta de API recibida: GET /protocols", response.status)
      const data = await handleResponse(response)
      return data || []
    } catch (error) {
      console.error("Error obteniendo protocolos:", error)
      throw error
    }
  },

  getProtocol: async (protocolId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo protocolo:", error)
      throw error
    }
  },

  createProtocol: async (protocol: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(protocol),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando protocolo:", error)
      throw error
    }
  },

  updateProtocol: async (protocolId: number, protocol: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(protocol),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando protocolo:", error)
      throw error
    }
  },

  deleteProtocol: async (protocolId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error eliminando protocolo:", error)
      throw error
    }
  },

  addFormToProtocol: async (protocolId: number, formId: number, formData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms/${formId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error agregando formulario a protocolo:", error)
      throw error
    }
  },

  getProtocolForms: async (protocolId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formularios del protocolo:", error)
      throw error
    }
  },

  // Nuevo método para actualizar formularios de un protocolo
  updateProtocolForms: async (protocolId: number, forms: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(forms),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando formularios del protocolo:", error)
      throw error
    }
  },
}

// API para patient-protocols (asignación de pacientes a protocolos)
export const patientProtocolsApi = {
  // Asignar paciente a protocolo
  assignPatientToProtocol: async (patientId: number, protocolId: number, assignedBy: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-protocols`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          patient_id: patientId,
          protocol_id: protocolId,
          start_date: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD
          assigned_by: assignedBy,
        }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error asignando paciente a protocolo:", error)
      throw error
    }
  },

  // Obtener pacientes por protocolo
  getPatientsByProtocol: async (protocolId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-protocols/protocol/${protocolId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo pacientes del protocolo:", error)
      throw error
    }
  },

  // Actualizar asignaciones de pacientes a protocolo
  updatePatientProtocolAssignments: async (protocolId: number, patients: any[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-protocols/${protocolId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ patients }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando asignaciones de pacientes:", error)
      throw error
    }
  },
}

// API para alertas
export const alertsApi = {
  getActiveAlerts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/active`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo alertas activas:", error)
      throw error
    }
  },

  getAlertsByPatientProtocol: async (patientProtocolId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/patient-protocol/${patientProtocolId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo alertas:", error)
      throw error
    }
  },

  resolveAlert: async (alertId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
        method: "PUT",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error resolviendo alerta:", error)
      throw error
    }
  },
}
