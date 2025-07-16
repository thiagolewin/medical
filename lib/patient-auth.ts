import { config } from "./config"

export interface PatientUser {
  id: number
  username: string
  email: string
  token?: string
}

export const patientAuthUtils = {
  // Obtener los datos del paciente
  getPatient: (): PatientUser | null => {
    if (typeof window === "undefined") return null

    try {
      const patientData = localStorage.getItem(config.PATIENT_USER_KEY)

      if (!patientData) {
        return null
      }

      // Verificar que no sea un token JWT (los JWT empiezan con "eyJ")
      if (patientData.startsWith("eyJ")) {
        localStorage.removeItem(config.PATIENT_USER_KEY)
        return null
      }

      const parsedData = JSON.parse(patientData)
      return parsedData
    } catch (error) {
      localStorage.removeItem(config.PATIENT_USER_KEY)
      return null
    }
  },

  // Guardar los datos del paciente
  setPatient: (patient: PatientUser): void => {
    if (typeof window === "undefined") return

    try {
      const patientDataString = JSON.stringify(patient)
      localStorage.setItem(config.PATIENT_USER_KEY, patientDataString)
    } catch (error) {
    }
  },

  // Verificar si el paciente está autenticado
  isPatientAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false

    const patient = patientAuthUtils.getPatient()

    return !!(patient && patient.id)
  },

  // Limpiar la autenticación del paciente
  clearPatientAuth: (): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(config.PATIENT_USER_KEY)
  },

  // Obtener headers de autenticación para requests (solo headers básicos)
  getPatientAuthHeaders: () => ({
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  }),
}
