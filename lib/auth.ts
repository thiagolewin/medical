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
      const userStr = localStorage.getItem(config.USER_KEY)

      if (!userStr) {
        return null
      }

      // Verificar si es un JWT token en lugar de datos de usuario
      if (userStr.startsWith("eyJ")) {
        localStorage.removeItem(config.USER_KEY)
        return null
      }

      const userData = JSON.parse(userStr)
      return userData
    } catch (error) {
      localStorage.removeItem(config.USER_KEY)
      return null
    }
  },

  // Guardar usuario en localStorage
  setUser: (user: User) => {
    if (typeof window === "undefined") return

    try {
      // Asegurar que no guardemos el token en los datos del usuario
      const userToSave = { ...user }
      delete userToSave.token

      const userStr = JSON.stringify(userToSave)

      localStorage.setItem(config.USER_KEY, userStr)

      // Verificar inmediatamente
      const saved = localStorage.getItem(config.USER_KEY)
    } catch (error) {
    }
  },

  // Limpiar datos de autenticación
  clearAuth: () => {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(config.USER_KEY)

      // También limpiar cualquier clave que pueda estar causando conflictos
      localStorage.removeItem("user")
      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_token")

    } catch (error) {
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    try {
      const user = authUtils.getUser();
      return !!user;
    } catch (error) {
      return false;
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

  // Verificar si el usuario puede crear/modificar datos
  canModifyData: (): boolean => {
    const user = authUtils.getUser()
    return user?.role === "admin"
  },

  // Verificar si el usuario puede ver datos
  canViewData: (): boolean => {
    const user = authUtils.getUser()
    return user?.role === "admin" || user?.role === "editor" || user?.role === "viewer"
  },
}
