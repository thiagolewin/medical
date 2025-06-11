import { config } from "./config"

// Tipos para la API de pacientes
export interface PatientLoginRequest {
  username: string
  password: string
}

export interface PatientLoginResponse {
  user: {
    id: number
    username: string
    email: string
  }
  token: string
}

export interface PatientProtocol {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

export interface PatientForm {
  id: number
  title: string
  description: string
  protocol_id: number
  status: string
  created_at: string
  updated_at: string
}

// Función helper para hacer requests con autenticación
const makePatientRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(config.PATIENT_TOKEN_KEY)

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// API de autenticación de pacientes
export const patientAuthApi = {
  login: async (credentials: PatientLoginRequest): Promise<PatientLoginResponse> => {
    console.log("Enviando request de login de paciente:", credentials)

    const response = await fetch(`${config.API_BASE_URL}/patients/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error en login de paciente:", errorData)
      throw new Error(errorData.message || "Error al iniciar sesión")
    }

    const data = await response.json()
    console.log("Respuesta exitosa de login de paciente:", data)
    return data
  },

  getProfile: async () => {
    return makePatientRequest("/patients/profile")
  },

  updateProfile: async (profileData: any) => {
    return makePatientRequest("/patients/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    })
  },
}

// API de protocolos para pacientes
export const patientProtocolApi = {
  getMyProtocols: async (): Promise<PatientProtocol[]> => {
    return makePatientRequest("/patients/protocols")
  },

  getProtocolById: async (id: number): Promise<PatientProtocol> => {
    return makePatientRequest(`/patients/protocols/${id}`)
  },
}

// API de formularios para pacientes
export const patientFormApi = {
  getMyForms: async (): Promise<PatientForm[]> => {
    return makePatientRequest("/patients/forms")
  },

  getFormById: async (id: number): Promise<PatientForm> => {
    return makePatientRequest(`/patients/forms/${id}`)
  },

  submitForm: async (formId: number, formData: any) => {
    return makePatientRequest(`/patients/forms/${formId}/submit`, {
      method: "POST",
      body: JSON.stringify(formData),
    })
  },
}
