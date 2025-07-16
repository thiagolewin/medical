"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2, Mail, User, Calendar, Phone, Globe, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { config } from "@/lib/config"

interface PatientData {
  id: number
  first_name: string
  last_name: string
  nationality_id: number
  date_of_birth: string
  email: string
  phone: string
  username: string
  nationality_es: string
  nationality_en: string
}

export default function PatientProfilePage() {
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [newEmail, setNewEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patientId = localStorage.getItem("patientId")
        if (!patientId) {
          throw new Error("ID de paciente no encontrado")
        }

        const response = await fetch(`${config.API_BASE_URL}/patients/${patientId}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("patientToken")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar datos del paciente")
        }

        const data = await response.json();
        setPatient(data.data);
        setNewEmail(data.data.email);
      } catch (error) {
        setMessage({ type: "error", text: "Error al cargar los datos del perfil" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientData()
  }, [])

  const handleEmailChange = async () => {
    if (!patient) return

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setMessage({ type: "error", text: "Por favor ingrese un email válido" })
      return
    }

    if (newEmail === patient.email) {
      setMessage({ type: "error", text: "El nuevo email debe ser diferente al actual" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`${config.API_BASE_URL}/patients/cambiarMail/${patient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${localStorage.getItem("patientToken")}`,
        },
        body: JSON.stringify({
          mail: newEmail,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al cambiar el email")
      }

      // Actualizar los datos locales
      setPatient({ ...patient, email: newEmail })
      setMessage({ type: "success", text: "Email actualizado exitosamente" })
    } catch (error) {
      setMessage({ type: "error", text: "Error al cambiar el email. Por favor, inténtelo de nuevo." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error al cargar los datos del perfil</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal</p>
      </div>

      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Información personal (solo lectura) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>Esta información no puede ser modificada por el paciente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nombre</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">{patient.first_name}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Apellido</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">{patient.last_name}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Nacionalidad
              </Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">{patient.nationality_es}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de Nacimiento
              </Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {new Date(patient.date_of_birth).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono
            </Label>
            <div className="p-3 bg-gray-50 rounded-md text-sm">{patient.phone}</div>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Cambiar Email
          </CardTitle>
          <CardDescription>Actualiza tu dirección de correo electrónico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Email Actual</Label>
            <div className="p-3 bg-gray-50 rounded-md text-sm">{patient.email}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail" className="text-sm font-medium text-gray-700">
              Nuevo Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo@ejemplo.com"
              className="max-w-md"
            />
          </div>

          <Button onClick={handleEmailChange} disabled={isSaving || newEmail === patient.email}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Actualizar Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Información importante</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Solo puedes cambiar tu dirección de correo electrónico</li>
          <li>• Para cambiar otros datos, contacta con tu médico</li>
          <li>• El email debe tener un formato válido</li>
          <li>• Recibirás notificaciones en el nuevo email</li>
        </ul>
      </div>
    </div>
  )
}
