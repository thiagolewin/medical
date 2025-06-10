// Configuración global de la aplicación
export const config = {
  // URL base de la API - cambiar aquí cuando cambie el ngrok
  API_BASE_URL: "https://ee6e-181-110-100-252.ngrok-free.app/api",

  // Configuración de la aplicación
  APP_NAME: "MediTrack",
  APP_DESCRIPTION: "Sistema de Seguimiento Médico de Pacientes",

  // Configuración de autenticación
  TOKEN_KEY: "meditrack_token",
  USER_KEY: "meditrack_user",

  // Configuración específica para pacientes
  PATIENT_TOKEN_KEY: "meditrack_patient_token",
  PATIENT_USER_KEY: "meditrack_patient_user",
}
