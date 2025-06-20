import { config } from "./config"

export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "editor" | "viewer"
  name?: string
  token?: string
}

export const authUtils = {
  // Obtener usuario del localStorage
  getUser: (): User | null => {
    if (typeof window === "undefined") return null

    try {
      console.log("=== getUser ===")
      console.log("USER_KEY:", config.USER_KEY)

      const userStr = localStorage.getItem(config.USER_KEY)
      console.log("Raw user data from localStorage:", userStr)

      if (!userStr) {
        console.log("No user data found")
        return null
      }

      // Verificar si es un JWT token en lugar de datos de usuario
      if (userStr.startsWith("eyJ")) {
        console.error("Se encontró un token JWT en lugar de datos del usuario")
        console.log("Limpiando datos corruptos...")
        localStorage.removeItem(config.USER_KEY)
        return null
      }

      const userData = JSON.parse(userStr)
      console.log("Parsed user data:", userData)
      return userData
    } catch (error) {
      console.error("Error getting user:", error)
      console.log("Limpiando datos corruptos...")
      localStorage.removeItem(config.USER_KEY)
      return null
    }
  },

  // Guardar usuario en localStorage
  setUser: (user: User) => {
    if (typeof window === "undefined") return

    try {
      console.log("=== setUser ===")
      console.log("USER_KEY:", config.USER_KEY)
      console.log("User data to save:", user)

      // Asegurar que no guardemos el token en los datos del usuario
      const userToSave = { ...user }
      delete userToSave.token

      const userStr = JSON.stringify(userToSave)
      console.log("Stringified user data (sin token):", userStr)

      localStorage.setItem(config.USER_KEY, userStr)
      console.log("User data saved to localStorage")

      // Verificar inmediatamente
      const saved = localStorage.getItem(config.USER_KEY)
      console.log("Verification - saved data:", saved)
    } catch (error) {
      console.error("Error setting user:", error)
    }
  },

  // Obtener token
  getToken: (): string | null => {
    if (typeof window === "undefined") return null

    try {
      console.log("=== getToken ===")
      console.log("TOKEN_KEY:", config.TOKEN_KEY)

      const token = localStorage.getItem(config.TOKEN_KEY)
      console.log("Token from localStorage:", token ? "[PRESENTE]" : "[AUSENTE]")
      return token
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  },

  // Guardar token
  setToken: (token: string) => {
    if (typeof window === "undefined") return

    try {
      console.log("=== setToken ===")
      console.log("TOKEN_KEY:", config.TOKEN_KEY)
      console.log("Token to save:", token ? "[PRESENTE]" : "[AUSENTE]")

      localStorage.setItem(config.TOKEN_KEY, token)
      console.log("Token saved to localStorage")

      // Verificar inmediatamente
      const saved = localStorage.getItem(config.TOKEN_KEY)
      console.log("Verification - saved token:", saved ? "[PRESENTE]" : "[AUSENTE]")
    } catch (error) {
      console.error("Error setting token:", error)
    }
  },

  // Limpiar datos de autenticación
  clearAuth: () => {
    if (typeof window === "undefined") return

    try {
      console.log("=== clearAuth ===")
      console.log("Clearing USER_KEY:", config.USER_KEY)
      console.log("Clearing TOKEN_KEY:", config.TOKEN_KEY)

      localStorage.removeItem(config.USER_KEY)
      localStorage.removeItem(config.TOKEN_KEY)

      // También limpiar cualquier clave que pueda estar causando conflictos
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_token")

      console.log("Auth data cleared")
    } catch (error) {
      console.error("Error clearing auth:", error)
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    try {
      console.log("=== isAuthenticated ===")

      const user = authUtils.getUser()
      const token = authUtils.getToken()

      console.log("User exists:", !!user)
      console.log("Token exists:", !!token)

      const isAuth = !!user && !!token
      console.log("Final isAuthenticated result:", isAuth)

      return isAuth
    } catch (error) {
      console.error("Error checking authentication:", error)
      return false
    }
  },

  // Verificar si el usuario tiene un rol específico
  hasRole: (role: string): boolean => {
    const user = authUtils.getUser()
    return user?.role === role
  },

  // Verificar si el usuario puede editar (admin o editor)
  canEdit: (): boolean => {
    const user = authUtils.getUser()
    return user?.role === "admin" || user?.role === "editor"
  },

  // Verificar si el usuario es admin
  isAdmin: (): boolean => {
    const user = authUtils.getUser()
    return user?.role === "admin"
  },
}
