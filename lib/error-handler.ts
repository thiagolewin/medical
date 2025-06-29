// Clase base para errores de la API
export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
  }
}

// Error específico para problemas de red
export class NetworkError extends ApiError {
  constructor(message = "Error de conexión. Por favor, verifique su conexión a internet.") {
    super(message, 0)
    this.name = "NetworkError"
  }
}

// Error específico para validación de datos
export class ValidationError extends ApiError {
  fields: Record<string, string>

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 422)
    this.name = "ValidationError"
    this.fields = fields
  }
}

// Función para manejar errores de forma consistente
export function handleApiError(error: unknown): ApiError {
  console.error("API Error:", error)

  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof Error) {
    // Si es un error de red (fetch)
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return new NetworkError()
    }
    return new ApiError(error.message)
  }

  return new ApiError("Ha ocurrido un error desconocido")
}

// Hook para manejar errores en componentes React
export function useErrorHandler() {
  const handleError = (error: unknown, defaultMessage = "Ha ocurrido un error"): string => {
    const apiError = handleApiError(error)

    // Personalizar mensajes según el código de estado
    switch (apiError.statusCode) {
      case 401:
        return "Su sesión ha expirado. Por favor, inicie sesión nuevamente."
      case 403:
        return "No tiene permisos para realizar esta acción."
      case 404:
        return "El recurso solicitado no fue encontrado."
      case 422:
        return apiError.message || "Datos inválidos. Por favor, verifique la información ingresada."
      case 0:
        return "Error de conexión. Por favor, verifique su conexión a internet."
      default:
        return apiError.message || defaultMessage
    }
  }

  return { handleError }
}

// Componente para mostrar errores inline
export function InlineError({ message }: { message: string }) {
  if (!message) return null
  return <p className="text-sm text-red-500 mt-1">{message}</p>
}
