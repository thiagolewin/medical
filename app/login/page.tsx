"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { usersApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("=== INICIO LOGIN ADMIN ===")
    console.log("Username:", username)
    console.log("Password:", password ? "[PRESENTE]" : "[VACÍO]")

    try {
      console.log("Llamando a usersApi.login...")

      const response = await usersApi.login({
        username,
        password,
      })

      console.log("Login exitoso, respuesta recibida:", response)

      // La respuesta exitosa tiene la estructura:
      // { id, username, email, role, token }
      const userData = {
        id: response.id,
        username: response.username,
        email: response.email,
        role: response.role,
        name: response.username,
        token: response.token,
      }

      console.log("Guardando datos del usuario:", userData)
      console.log("Guardando token:", response.token ? "[PRESENTE]" : "[AUSENTE]")

      // Guardar los datos del usuario y token
      authUtils.setUser(userData)
      authUtils.setToken(response.token)

      // Verificar que se guardó correctamente
      const savedUser = authUtils.getUser()
      const savedToken = authUtils.getToken()

      console.log("Verificación - Usuario guardado:", savedUser)
      console.log("Verificación - Token guardado:", savedToken ? "[PRESENTE]" : "[AUSENTE]")

      console.log("Redirigiendo a dashboard...")

      // Usar replace en lugar de push para evitar volver atrás
      router.replace("/admin/dashboard")
    } catch (err: any) {
      console.log("=== ERROR EN LOGIN ADMIN ===")
      console.error("Error completo:", err)
      console.error("Error name:", err.name)
      console.error("Error message:", err.message)
      console.error("Error stack:", err.stack)

      let errorMessage = "Error al iniciar sesión. Por favor, inténtelo de nuevo."

      if (err.message) {
        errorMessage = err.message
      } else if (err.toString) {
        errorMessage = err.toString()
      }

      console.log("Mostrando error al usuario:", errorMessage)
      setError(errorMessage)
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  ¿Olvidó su contraseña?
                </Link>
              </div>
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
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Ingrese sus credenciales para acceder al sistema médico</p>
        </CardFooter>
      </Card>
    </div>
  )
}
