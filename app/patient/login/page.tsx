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
import { AlertCircle, Heart } from "lucide-react"
import { patientAuthApi } from "@/lib/patient-api"
import { patientAuthUtils } from "@/lib/patient-auth"

export default function PatientLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("Intentando login de paciente con:", { email, password })

      const response = await patientAuthApi.login({
        email,
        password,
      })

      console.log("Respuesta de login de paciente exitosa:", response)

      // La respuesta exitosa tiene la estructura del paciente
      const patientData = {
        id: response.id,
        email: response.email,
        first_name: response.first_name,
        last_name: response.last_name,
        date_of_birth: response.date_of_birth,
        phone: response.phone,
        token: response.token,
      }

      // Guardar los datos del paciente y token
      patientAuthUtils.setPatient(patientData)
      patientAuthUtils.setPatientToken(response.token)

      // Redirigir al dashboard del paciente
      router.push("/patient/dashboard")
    } catch (err: any) {
      console.error("Error en login de paciente:", err)
      setError(err.message || "Error al iniciar sesión. Por favor, verifique sus credenciales.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
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
              Ingrese su email y contraseña para acceder a su portal
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
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="su-email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/patient/forgot-password" className="text-sm text-blue-600 hover:underline">
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
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Necesita ayuda?{" "}
                <Link href="/patient/support" className="text-blue-600 hover:underline">
                  Contacte con soporte
                </Link>
              </p>
            </div>
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
