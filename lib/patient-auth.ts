import { config } from "./config"

export interface PatientUser {
  id: number
  email: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  token?: string
}

export const patientAuthUtils = {
  // Obtener paciente del localStorage
  getPatient: (): PatientUser | null => {
    if (typeof window === "undefined") return null

    const patientStr = localStorage.getItem(config.PATIENT_USER_KEY)
    if (!patientStr) return null

    try {
      return JSON.parse(patientStr)
    } catch {
      return null
    }
  },

  // Guardar paciente en localStorage
  setPatient: (patient: PatientUser) => {
    if (typeof window === "undefined") return
    localStorage.setItem(config.PATIENT_USER_KEY, JSON.stringify(patient))
  },

  // Obtener token del paciente
  getPatientToken: (): string | null => {
    if (typeof window === "undefined") return null

    // Primero intentar obtener del paciente
    const patient = patientAuthUtils.getPatient()
    if (patient?.token) return patient.token

    // Si no, obtener del localStorage separado
    return localStorage.getItem(config.PATIENT_TOKEN_KEY)
  },

  // Guardar token del paciente
  setPatientToken: (token: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem(config.PATIENT_TOKEN_KEY, token)
  },

  // Limpiar datos de autenticación del paciente
  clearPatientAuth: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(config.PATIENT_USER_KEY)
    localStorage.removeItem(config.PATIENT_TOKEN_KEY)
  },

  // Verificar si el paciente está autenticado
  isPatientAuthenticated: (): boolean => {
    return !!patientAuthUtils.getPatient() && !!patientAuthUtils.getPatientToken()
  },
}
