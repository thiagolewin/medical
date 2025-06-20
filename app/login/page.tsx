"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { authUtils } from "@/lib/auth"
import { config } from "@/lib/config"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Limpiar localStorage al cargar la página
  useEffect(() => {
    console.log("Limpiando localStorage al cargar página de login...")
    authUtils.clearAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("=== INICIO LOGIN ADMIN ===")
    console.log("Username:", username)
    console.log("Password:", password ? "[PRESENTE]" : "[VACÍO]")
    console.log("API Base URL:", config.API_BASE_URL)

    try {
      // Limpiar datos previos antes de empezar
      console.log("Limpiando datos previos...")
      authUtils.clearAuth()

      console.log("Llamando a API de login admin...")

      const response = await fetch(`${config.API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          console.log("Error data:", errorData)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.log("No se pudo parsear error como JSON")
        }
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log("Login exitoso, respuesta recibida:", responseData)

      // Verificar estructura de respuesta
      if (!responseData.id || !responseData.username || !responseData.token) {
        console.error("Respuesta incompleta del servidor:", responseData)
        throw new Error("Respuesta del servidor incompleta")
      }

      // Preparar datos del usuario SIN el token
      const userData = {
        id: responseData.id,
        username: responseData.username,
        email: responseData.email,
        role: responseData.role,
        name: responseData.username,
      }

      console.log("Datos del usuario preparados (sin token):", userData)
      console.log("Token separado:", responseData.token ? "[PRESENTE]" : "[AUSENTE]")

      // Guardar token PRIMERO
      console.log("Guardando token...")
      authUtils.setToken(responseData.token)

      // Luego guardar datos del usuario
      console.log("Guardando datos del usuario...")
      authUtils.setUser(userData)

      // Verificar que se guardó correctamente
      console.log("Verificando datos guardados...")
      const savedUser = authUtils.getUser()
      const savedToken = authUtils.getToken()
      const isAuth = authUtils.isAuthenticated()

      console.log("Verificación - Usuario guardado:", savedUser)
      console.log("Verificación - Token guardado:", savedToken ? "[PRESENTE]" : "[AUSENTE]")
      console.log("Verificación - isAuthenticated:", isAuth)

      if (!isAuth) {
        console.error("Error: isAuthenticated devolvió false después de guardar")
        console.error("Contenido completo de localStorage:")
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          const value = localStorage.getItem(key!)
          console.error(`- ${key}: ${value}`)
        }
        throw new Error("Error guardando datos de autenticación")
      }

      console.log("Autenticación exitosa, redirigiendo a dashboard...")

      // Usar replace en lugar de push para evitar volver atrás
      router.replace("/admin/dashboard")
    } catch (err: any) {
      console.log("=== ERROR EN LOGIN ADMIN ===")
      console.error("Error completo:", err)

      let errorMessage = "Error al iniciar sesión. Por favor, inténtelo de nuevo."

      if (err.message) {
        errorMessage = err.message
      }

      console.log("Mostrando error al usuario:", errorMessage)
      setError(errorMessage)

      // Limpiar datos en caso de error
      authUtils.clearAuth()
    } finally {
      setIsLoading(false)
      console.log("=== FIN LOGIN ADMIN ===")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">Ingrese sus credenciales para acceder al sistema médico</p>
          <div className="text-center">
            <Link href="/patient/login" className="text-sm text-primary hover:underline">
              ¿Es usted paciente? Acceda aquí
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
