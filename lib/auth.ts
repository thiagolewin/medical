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

    const userStr = localStorage.getItem(config.USER_KEY)
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  // Guardar usuario en localStorage
  setUser: (user: User) => {
    if (typeof window === "undefined") return
    localStorage.setItem(config.USER_KEY, JSON.stringify(user))
  },

  // Obtener token
  getToken: (): string | null => {
    if (typeof window === "undefined") return null

    // Primero intentar obtener del usuario
    const user = authUtils.getUser()
    if (user?.token) return user.token

    // Si no, obtener del localStorage separado
    return localStorage.getItem(config.TOKEN_KEY)
  },

  // Guardar token
  setToken: (token: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem(config.TOKEN_KEY, token)
  },

  // Limpiar datos de autenticación
  clearAuth: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(config.USER_KEY)
    localStorage.removeItem(config.TOKEN_KEY)
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    return !!authUtils.getUser() && !!authUtils.getToken()
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
