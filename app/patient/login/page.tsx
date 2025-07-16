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
import { AlertCircle, Heart } from "lucide-react"
import { patientAuthApi } from "@/lib/patient-api"
import { patientAuthUtils } from "@/lib/patient-auth"

export default function PatientLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Verificar si ya está autenticado
  useEffect(() => {
    const checkExistingAuth = () => {
      if (patientAuthUtils.isPatientAuthenticated()) {
        router.push("/patient/forms")
      }
    }

    checkExistingAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Limpiar datos previos antes de intentar login
      patientAuthUtils.clearPatientAuth()

      const response = await patientAuthApi.login({
        username,
        password,
      });
      const user = response.data;
      if (!user || !user.id || !user.username || !user.email) {
        throw new Error("Datos de usuario incompletos");
      }
      const patientData = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
      patientAuthUtils.setPatient(patientData);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const savedPatient = patientAuthUtils.getPatient();
      if (!savedPatient) {
        throw new Error("Error: No se pudieron guardar los datos del paciente");
      }
      const isAuth = patientAuthUtils.isPatientAuthenticated();
      router.replace("/patient/forms");
    } catch (err: any) {
      // Limpiar datos en caso de error
      patientAuthUtils.clearPatientAuth()

      // Mostrar error más específico
      let errorMessage = "Error desconocido al iniciar sesión"

      if (err.message) {
        errorMessage = err.message
      } else if (err.toString) {
        errorMessage = err.toString()
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-600 p-3 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Portal del Paciente</h1>
          <p className="text-gray-600 mt-2">Acceda a su información médica</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Iniciar sesión</CardTitle>
            <CardDescription className="text-center">
              Ingrese su usuario y contraseña para acceder a su portal
            </CardDescription>
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
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
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
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center"></div>
            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:underline">
                ¿Es usted personal médico? Acceda aquí
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
