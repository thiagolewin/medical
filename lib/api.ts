import { config } from "./config"

const API_BASE_URL = config.API_BASE_URL
const TOKEN_KEY = config.TOKEN_KEY

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }
  return response.json()
}

// Forms API
export const formsApi = {
  getForms: async () => {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getForm: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createForm: async (formData: any) => {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    })
    return handleResponse(response)
  },

  updateForm: async (id: number, formData: any) => {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    })
    return handleResponse(response)
  },

  deleteForm: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Protocols API
export const protocolsApi = {
  getProtocols: async () => {
    const response = await fetch(`${API_BASE_URL}/protocols`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getProtocol: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createProtocol: async (protocolData: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(protocolData),
    })
    return handleResponse(response)
  },

  updateProtocol: async (id: number, protocolData: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(protocolData),
    })
    return handleResponse(response)
  },

  deleteProtocol: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getProtocolForms: async (protocolId: number) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  updateProtocolForms: async (protocolId: number, formsData: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(formsData),
    })
    return handleResponse(response)
  },
}

// Patients API
export const patientsApi = {
  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getPatient: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createPatient: async (patientData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    })
    return handleResponse(response)
  },

  updatePatient: async (id: number, patientData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    })
    return handleResponse(response)
  },

  deletePatient: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getNationalities: async () => {
    const response = await fetch(`${API_BASE_URL}/patients/nationalities`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Patient Protocols API
export const patientProtocolsApi = {
  getPatientsByProtocol: async (protocolId: number) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/protocol/${protocolId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getProtocolsByPatient: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/patient/${patientId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  assignPatientToProtocol: async (assignmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(assignmentData),
    })
    return handleResponse(response)
  },

  updatePatientProtocolAssignments: async (protocolId: number, assignments: any) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/protocol/${protocolId}/assignments`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(assignments),
    })
    return handleResponse(response)
  },

  removePatientFromProtocol: async (patientId: number, protocolId: number) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/eliminarPaciente`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        idPaciente: patientId,
        idProtocolo: protocolId,
      }),
    })
    return handleResponse(response)
  },
}

// Users API
export const usersApi = {
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getUser: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createUser: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return handleResponse(response)
  },

  updateUser: async (id: number, userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return handleResponse(response)
  },

  deleteUser: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Analysis API
export const analysisApi = {
  executeAnalysis: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/responses/analizeData`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },
}

// Questions API
export const questionsApi = {
  getQuestionsByForm: async (formId: number) => {
    const response = await fetch(`${API_BASE_URL}/questions/form/${formId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getQuestionOptions: async (questionId: number) => {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createQuestion: async (questionData: any) => {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData),
    })
    return handleResponse(response)
  },

  addOption: async (questionId: number, optionData: any) => {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(optionData),
    })
    return handleResponse(response)
  },
}

// Question Types API
export const questionTypesApi = {
  getQuestionTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/question-types`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
  createQuestionType: async (data: { key_name: string, name_es: string, name_en: string }) => {
    const response = await fetch(`${API_BASE_URL}/question-types`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
}

// Nationalities API
export const nationalitiesApi = {
  getNationalities: async () => {
    const response = await fetch(`${API_BASE_URL}/patients/nationalities`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}
