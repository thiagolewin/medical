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
    const token = localStorage.getItem(config.PATIENT_TOKEN_KEY)
    console.log(
      `Obteniendo token de clave '${config.PATIENT_TOKEN_KEY}':`,
      token ? "[TOKEN PRESENTE]" : "[NO HAY TOKEN]",
    )
    return token
  },

  // Guardar el token del paciente
  setPatientToken: (token: string): void => {
    if (typeof window === "undefined") return
    console.log(`Guardando token en clave '${config.PATIENT_TOKEN_KEY}':`, token ? "[TOKEN PRESENTE]" : "[TOKEN VACÍO]")
    localStorage.setItem(config.PATIENT_TOKEN_KEY, token)

    // Verificar que se guardó correctamente
    const saved = localStorage.getItem(config.PATIENT_TOKEN_KEY)
    console.log("Token guardado verificación:", saved ? "[GUARDADO CORRECTAMENTE]" : "[ERROR AL GUARDAR]")
  },

  // Obtener los datos del paciente
  getPatient: (): PatientUser | null => {
    if (typeof window === "undefined") return null

    try {
      console.log(`Obteniendo datos del paciente de clave '${config.PATIENT_USER_KEY}'`)
      const patientData = localStorage.getItem(config.PATIENT_USER_KEY)

      console.log("Datos crudos del localStorage:", patientData)
      console.log("Tipo de datos:", typeof patientData)
      console.log("Longitud de datos:", patientData?.length)

      if (!patientData) {
        console.log("No hay datos del paciente en localStorage")
        return null
      }

      // Verificar que no sea un token JWT (los JWT empiezan con "eyJ")
      if (patientData.startsWith("eyJ")) {
        console.error("ERROR: Se encontró un token JWT en lugar de datos del paciente")
        console.error("Datos encontrados:", patientData.substring(0, 50) + "...")
        console.error(`Clave utilizada: ${config.PATIENT_USER_KEY}`)
        console.error(`Clave del token debería ser: ${config.PATIENT_TOKEN_KEY}`)

        // Mostrar todo el contenido de localStorage para debugging
        console.error("Contenido completo de localStorage:")
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          const value = localStorage.getItem(key!)
          console.error(`  ${key}: ${value?.substring(0, 50)}${value && value.length > 50 ? "..." : ""}`)
        }

        // Limpiar datos corruptos
        localStorage.removeItem(config.PATIENT_USER_KEY)
        return null
      }

      const parsedData = JSON.parse(patientData)
      console.log("Datos del paciente parseados correctamente:", parsedData)
      return parsedData
    } catch (error) {
      console.error("Error parsing patient data:", error)
      console.error("Datos que causaron el error:", localStorage.getItem(config.PATIENT_USER_KEY))

      // Limpiar datos corruptos
      localStorage.removeItem(config.PATIENT_USER_KEY)
      return null
    }
  },

  // Guardar los datos del paciente
  setPatient: (patient: PatientUser): void => {
    if (typeof window === "undefined") return

    try {
      const patientDataString = JSON.stringify(patient)
      console.log(`Guardando datos del paciente en clave '${config.PATIENT_USER_KEY}':`, patient)
      console.log("JSON string a guardar:", patientDataString)
      console.log("Longitud del JSON:", patientDataString.length)

      localStorage.setItem(config.PATIENT_USER_KEY, patientDataString)

      // Verificar que se guardó correctamente
      const saved = localStorage.getItem(config.PATIENT_USER_KEY)
      console.log("Verificación - datos guardados:", saved)
      console.log("¿Coinciden los datos?", saved === patientDataString)
    } catch (error) {
      console.error("Error guardando datos del paciente:", error)
    }
  },

  // Verificar si el paciente está autenticado
  isPatientAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false

    const token = patientAuthUtils.getPatientToken()
    const patient = patientAuthUtils.getPatient()

    console.log("Verificando autenticación del paciente:", {
      hasToken: !!token,
      hasPatient: !!patient,
      patientId: patient?.id,
      tokenKey: config.PATIENT_TOKEN_KEY,
      userKey: config.PATIENT_USER_KEY,
    })

    return !!(token && patient && patient.id)
  },

  // Limpiar la autenticación del paciente
  clearPatientAuth: (): void => {
    if (typeof window === "undefined") return
    console.log("Limpiando autenticación del paciente")
    console.log(`Removiendo token de clave: ${config.PATIENT_TOKEN_KEY}`)
    console.log(`Removiendo datos de clave: ${config.PATIENT_USER_KEY}`)

    localStorage.removeItem(config.PATIENT_TOKEN_KEY)
    localStorage.removeItem(config.PATIENT_USER_KEY)

    // Verificar que se limpiaron
    const tokenAfter = localStorage.getItem(config.PATIENT_TOKEN_KEY)
    const userAfter = localStorage.getItem(config.PATIENT_USER_KEY)
    console.log("Después de limpiar - token:", tokenAfter)
    console.log("Después de limpiar - usuario:", userAfter)
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
