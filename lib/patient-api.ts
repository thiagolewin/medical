import { config } from "./config"
import { handleApiResponse } from "./api";

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
  keynametype?: string // <-- Agregado para soportar el campo del backend
}

export interface QuestionOption {
  id: number
  question_id: number
  text_es: string
  text_en: string
  order_in_question: number
  key_name?: string
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

// Función helper para hacer requests sin autenticación por token
const makePatientRequest = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  }
  const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  const data = await handleApiResponse(response);
  return data;
}

// API de autenticación de pacientes
export const patientAuthApi = {
  login: async (credentials: PatientLoginRequest): Promise<{ data: { id: number; username: string; email: string } }> => {
    const response = await fetch(`${config.API_BASE_URL}/patients/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }

    const result = await response.json();
    const user = result.data;
    if (!user || !user.id || !user.username || !user.email) {
      throw new Error("Respuesta de login inválida: datos del usuario incompletos");
    }
    return { data: user };
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

  changeEmail: async (patientId: number, newEmail: string) => {
    const response = await fetch(`${config.API_BASE_URL}/patients/cambiarMail/${patientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ mail: newEmail }),
    })

    if (!response.ok) {
      const errorText = await response.text()

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
    return data
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
