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
    authUtils.clearAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Limpiar datos previos antes de empezar
      authUtils.clearAuth()

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

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          //
        }
        throw new Error(errorMessage)
      }

      const responseData = await response.json();
      const user = responseData.data;
      if (!user.id || !user.username) {
        throw new Error("Respuesta del servidor incompleta");
      }
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.username,
      };
      authUtils.setUser(userData);
      const savedUser = authUtils.getUser();
      router.replace("/admin/dashboard");
    } catch (err: any) {
      let errorMessage = "Error al iniciar sesión. Por favor, inténtelo de nuevo."

      if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)

      // Limpiar datos en caso de error
      authUtils.clearAuth()
    } finally {
      setIsLoading(false)
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
