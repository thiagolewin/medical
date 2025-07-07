import { config } from "./config"

const getHeaders = () => ({
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
  ...(localStorage.getItem(config.TOKEN_KEY) && {
    Authorization: `Bearer ${localStorage.getItem(config.TOKEN_KEY)}`,
  }),
})

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Auth API
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(credentials),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error en login:", error)
      throw error
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error en logout:", error)
      throw error
    }
  },
}

// Users API
export const usersApi = {
  getUsers: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/users`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo usuarios:", error)
      throw error
    }
  },

  getUser: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/users/${id}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo usuario:", error)
      throw error
    }
  },

  createUser: async (userData: {
    username: string
    email: string
    password: string
    role: string
  }) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/users/register`, {
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

  updateUser: async (
    id: number,
    userData: {
      username: string
      email: string
      role: string
    },
  ) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/users/${id}`, {
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

  deleteUser: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/users/${id}`, {
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

// Forms API
export const formsApi = {
  getForms: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/forms`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formularios:", error)
      throw error
    }
  },

  getForm: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/forms/${id}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formulario:", error)
      throw error
    }
  },

  createForm: async (formData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/forms`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando formulario:", error)
      throw error
    }
  },

  updateForm: async (id: number, formData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/forms/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(formData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando formulario:", error)
      throw error
    }
  },

  deleteForm: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/forms/${id}`, {
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

// Protocols API
export const protocolsApi = {
  getProtocols: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo protocolos:", error)
      throw error
    }
  },

  getProtocol: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols/${id}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo protocolo:", error)
      throw error
    }
  },

  createProtocol: async (protocolData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(protocolData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando protocolo:", error)
      throw error
    }
  },

  updateProtocol: async (id: number, protocolData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(protocolData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando protocolo:", error)
      throw error
    }
  },

  deleteProtocol: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error eliminando protocolo:", error)
      throw error
    }
  },

  getProtocolForms: async (protocolId: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols/${protocolId}/forms`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo formularios del protocolo:", error)
      throw error
    }
  },

  updateProtocolForms: async (protocolId: number, formsData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols/${protocolId}/forms`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(formsData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando formularios del protocolo:", error)
      throw error
    }
  },

  addFormToProtocol: async (protocolId: number, formId: number, formData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols/${protocolId}/forms/${formId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error agregando formulario al protocolo:", error)
      throw error
    }
  },
}

// Questions API
export const questionsApi = {
  getQuestionsByForm: async (formId: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/questions/form/${formId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo preguntas:", error)
      throw error
    }
  },

  createQuestion: async (questionData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/questions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(questionData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando pregunta:", error)
      throw error
    }
  },

  getQuestionOptions: async (questionId: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/questions/${questionId}/options`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo opciones de pregunta:", error)
      throw error
    }
  },

  addOption: async (questionId: number, optionData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/questions/${questionId}/options`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(optionData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error agregando opción:", error)
      throw error
    }
  },
}

// Question Types API
export const questionTypesApi = {
  getQuestionTypes: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/question-types`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo tipos de pregunta:", error)
      throw error
    }
  },

  createQuestionType: async (typeData: any) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/question-types`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(typeData),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error creando tipo de pregunta:", error)
      throw error
    }
  },
}

// Patients API
export const patientsApi = {
  getPatients: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/patients`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo pacientes:", error)
      throw error
    }
  },

  deletePatient: async (id: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/patients/${id}`, {
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

// Nationalities API
export const nationalitiesApi = {
  getNationalities: async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/nationalities`, {
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

// Patient Protocols API
export const patientProtocolsApi = {
  getPatientsByProtocol: async (protocolId: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/patient-protocols/protocol/${protocolId}`, {
        method: "GET",
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error obteniendo pacientes del protocolo:", error)
      throw error
    }
  },

  assignPatientToProtocol: async (patientId: number, protocolId: number, assignedBy: number) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/patient-protocols`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          patient_id: patientId,
          protocol_id: protocolId,
          start_date: new Date().toISOString(),
          assigned_by: assignedBy,
        }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error asignando paciente al protocolo:", error)
      throw error
    }
  },

  updatePatientProtocolAssignments: async (protocolId: number, assignments: any[]) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/patient-protocols/protocol/${protocolId}/assignments`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ assignments }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error actualizando asignaciones de pacientes:", error)
      throw error
    }
  },
}

// Analysis API
export const analysisApi = {
  executeAnalysis: async (payload: { filtros: any[]; traer: number[] }) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/responses/analizeData`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      })
      return handleResponse(response)
    } catch (error) {
      console.error("Error ejecutando análisis:", error)
      throw error
    }
  },
}
