import { config } from "./config"

export interface PatientUser {
  id: number
  username: string
  email: string
  token?: string
}

export const patientAuthUtils = {
  // Obtener el token del paciente
  getPatientToken: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(config.PATIENT_TOKEN_KEY)
  },

  // Guardar el token del paciente
  setPatientToken: (token: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(config.PATIENT_TOKEN_KEY, token)
  },

  // Obtener los datos del paciente
  getPatient: (): PatientUser | null => {
    if (typeof window === "undefined") return null
    const patientData = localStorage.getItem(config.PATIENT_USER_KEY)
    return patientData ? JSON.parse(patientData) : null
  },

  // Guardar los datos del paciente
  setPatient: (patient: PatientUser): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(config.PATIENT_USER_KEY, JSON.stringify(patient))
  },

  // Verificar si el paciente está autenticado
  isPatientAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false
    const token = patientAuthUtils.getPatientToken()
    const patient = patientAuthUtils.getPatient()
    return !!(token && patient)
  },

  // Limpiar la autenticación del paciente
  clearPatientAuth: (): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(config.PATIENT_TOKEN_KEY)
    localStorage.removeItem(config.PATIENT_USER_KEY)
  },

  // Obtener headers de autenticación para requests
  getPatientAuthHeaders: () => {
    const token = patientAuthUtils.getPatientToken()
    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        }
      : {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        }
  },
}
