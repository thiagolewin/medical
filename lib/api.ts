import { config } from "./config"

const API_BASE_URL = config.API_BASE_URL
const TOKEN_KEY = config.TOKEN_KEY

// Helper function to get auth headers
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
});

// Helper function to handle API responses
export const handleApiResponse = async (response: Response) => {
  const json = await response.json();
  if (json.error) {
    throw new Error(json.message || "Error desconocido");
  }
  return json.data;
};

// Forms API
export const formsApi = {
  getForms: async () => {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getForm: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  createForm: async (formData: any) => {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    })
    return handleApiResponse(response)
  },

  updateForm: async (id: number, formData: any) => {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    })
    return handleApiResponse(response)
  },

  deleteForm: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },
}

// Protocols API
export const protocolsApi = {
  getProtocols: async () => {
    const response = await fetch(`${API_BASE_URL}/protocols`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getProtocol: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  createProtocol: async (protocolData: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(protocolData),
    })
    return handleApiResponse(response)
  },

  updateProtocol: async (id: number, protocolData: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(protocolData),
    })
    return handleApiResponse(response)
  },

  deleteProtocol: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getProtocolForms: async (protocolId: number) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  updateProtocolForms: async (protocolId: number, formsData: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(formsData),
    })
    return handleApiResponse(response)
  },

  // Nueva función: agregar formulario a protocolo
  addFormToProtocol: async (protocolId: number, formId: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/protocols/${protocolId}/forms/${formId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleApiResponse(response)
  },
}

// Patients API
export const patientsApi = {
  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getPatient: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  createPatient: async (patientData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    })
    return handleApiResponse(response)
  },

  updatePatient: async (id: number, patientData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    })
    return handleApiResponse(response)
  },

  deletePatient: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getNationalities: async () => {
    const response = await fetch(`${API_BASE_URL}/patients/nationalities`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },
}

// Patient Protocols API
export const patientProtocolsApi = {
  getPatientsByProtocol: async (protocolId: number) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/protocol/${protocolId}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getProtocolsByPatient: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/patient/${patientId}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  assignPatientToProtocol: async (assignmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(assignmentData),
    })
    return handleApiResponse(response)
  },

  updatePatientProtocolAssignments: async (protocolId: number, assignments: any) => {
    const response = await fetch(`${API_BASE_URL}/patient-protocols/protocol/${protocolId}/assignments`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(assignments),
    })
    return handleApiResponse(response)
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
    return handleApiResponse(response)
  },
}

// Users API
export const usersApi = {
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getUser: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  createUser: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return handleApiResponse(response)
  },

  updateUser: async (id: number, userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return handleApiResponse(response)
  },

  deleteUser: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
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
    return handleApiResponse(response)
  },
}

// Questions API
export const questionsApi = {
  getQuestionsByForm: async (formId: number) => {
    const response = await fetch(`${API_BASE_URL}/questions/form/${formId}`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  getQuestionOptions: async (questionId: number) => {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },

  createQuestion: async (questionData: any) => {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData),
    })
    return handleApiResponse(response)
  },

  addOption: async (questionId: number, optionData: any) => {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(optionData),
    })
    return handleApiResponse(response)
  },
}

// Question Types API
export const questionTypesApi = {
  getQuestionTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/question-types`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },
  createQuestionType: async (data: { key_name: string, name_es: string, name_en: string }) => {
    const response = await fetch(`${API_BASE_URL}/question-types`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleApiResponse(response)
  },
}

// Nationalities API
export const nationalitiesApi = {
  getNationalities: async () => {
    const response = await fetch(`${API_BASE_URL}/patients/nationalities`, {
      headers: getAuthHeaders(),
    })
    return handleApiResponse(response)
  },
}
