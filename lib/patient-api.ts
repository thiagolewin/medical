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
  patient_id: number
  protocol_id: number
  start_date: string
  assigned_by: number
  protocol_name_es: string
  protocol_name_en: string
}

export interface ProtocolForm {
  id: number
  protocol_id: number
  form_id: number
  previous_form_id: number | null
  delay_days: number
  repeat_count: number
  repeat_interval_days: number
  order_in_protocol: number
  form_name_es: string
  form_name_en: string
}

export interface AvailableForm {
  id: number
  key_name: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: number
  form_id: number
  key_name: string
  text_es: string
  text_en: string
  question_type_id: number
  is_required: boolean
  order_in_form: number
  created_at: string
  updated_at: string
  question_type_es: string
  question_type_en: string
  options?: QuestionOption[]
}

export interface QuestionOption {
  id: number
  question_id: number
  text_es: string
  text_en: string
  order_in_question: number
}

export interface FormInstance {
  id: number
  patient_protocol_id: number
  protocol_form_id: number
  instance_number: number | null
  scheduled_date: string
  completed_at: string | null
  form_id?: number
  form_name_es?: string
  form_name_en?: string
  form_description_es?: string
  form_description_en?: string
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

  console.log(`Making request to: ${config.API_BASE_URL}${endpoint}`)

  const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error response:", errorText)

    try {
      const errorData = JSON.parse(errorText)
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    } catch (e) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
  }

  const data = await response.json()
  return data
}

// API de autenticación de pacientes
export const patientAuthApi = {
  login: async (credentials: PatientLoginRequest): Promise<PatientLoginResponse> => {
    console.log("=== PATIENT LOGIN REQUEST ===")
    console.log("URL:", `${config.API_BASE_URL}/patients/login`)
    console.log("Credentials:", credentials)

    const response = await fetch(`${config.API_BASE_URL}/patients/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(credentials),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response text:", errorText)

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Login successful, response data:", data)
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
  getMyProtocols: async (patientId: number): Promise<PatientProtocol[]> => {
    return makePatientRequest(`/patient-protocols/patient/${patientId}`)
  },

  getProtocolForms: async (protocolId: number): Promise<ProtocolForm[]> => {
    return makePatientRequest(`/protocols/${protocolId}/forms`)
  },

  getAvailableForms: async (protocolId: number, patientId: number): Promise<AvailableForm[]> => {
    return makePatientRequest(`/protocols/${protocolId}/available/${patientId}`)
  },

  getRespondedForms: async (protocolId: number, patientId: number): Promise<AvailableForm[]> => {
    return makePatientRequest(`/protocols/${protocolId}/responded/${patientId}`)
  },
}

// API de formularios para pacientes
export const patientFormApi = {
  getFormQuestions: async (formId: number): Promise<Question[]> => {
    return makePatientRequest(`/questions/form/${formId}`)
  },

  getQuestionOptions: async (questionId: number): Promise<QuestionOption[]> => {
    return makePatientRequest(`/questions/${questionId}/options`)
  },

  getFormInstances: async (patientProtocolId: number): Promise<FormInstance[]> => {
    return makePatientRequest(`/form-instances/patient-protocol/${patientProtocolId}`)
  },

  createFormInstance: async (data: {
    patient_protocol_id: string
    protocol_form_id: string
    scheduled_date: string
  }): Promise<FormInstance> => {
    return makePatientRequest("/form-instances/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  submitResponse: async (data: {
    form_instance_id: number
    question_id: number
    answer_text?: string
    answer_option_id?: number
  }) => {
    return makePatientRequest("/responses", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  completeFormInstance: async (formInstanceId: number) => {
    return makePatientRequest(`/form-instances/${formInstanceId}/complete`, {
      method: "PUT",
    })
  },
}

// Función helper para calcular si un formulario debe estar disponible
export const isFormAvailable = (protocolForm: ProtocolForm, protocolStartDate: string): boolean => {
  const startDate = new Date(protocolStartDate)
  const today = new Date()
  const availableDate = new Date(startDate)
  availableDate.setDate(availableDate.getDate() + protocolForm.delay_days)

  return today >= availableDate
}

// Función helper para calcular la próxima fecha disponible
export const getNextAvailableDate = (protocolForm: ProtocolForm, protocolStartDate: string): Date => {
  const startDate = new Date(protocolStartDate)
  const availableDate = new Date(startDate)
  availableDate.setDate(availableDate.getDate() + protocolForm.delay_days)
  return availableDate
}

// Función helper para verificar si un formulario ya fue completado
export const isFormCompleted = (protocolFormId: number, formInstances: FormInstance[]): boolean => {
  return formInstances.some(
    (instance) => instance.protocol_form_id === protocolFormId && instance.completed_at !== null,
  )
}
