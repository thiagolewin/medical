"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { nationalitiesApi } from "@/lib/api"
import { config } from "@/lib/config"
import { authUtils } from "@/lib/auth"

export default function NewPatientPage() {
  const router = useRouter()
  const [nationalities, setNationalities] = useState([])
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [patient, setPatient] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    nationalityId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
  })

  const user = typeof window !== "undefined" ? authUtils.getUser() : null;
  const isViewer = user?.role === "viewer";

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        setIsLoadingNationalities(true)
        const response = await nationalitiesApi.getNationalities()
        setNationalities(response)
        // Establecer la nacionalidad por defecto (Argentina)
        const defaultNationality = response.find((n) => n.name_es === "Argentina")
        if (defaultNationality) {
          setPatient((prev) => ({ ...prev, nationalityId: defaultNationality.id.toString() }))
        }
      } catch (error) {
        console.error("Error cargando nacionalidades:", error)
        alert("Error al cargar las nacionalidades")
      } finally {
        setIsLoadingNationalities(false)
      }
    }

    fetchNationalities()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPatient({ ...patient, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setPatient({ ...patient, [name]: value })
  }

  const savePatient = async () => {
    // Validar campos obligatorios
    if (
      !patient.firstName ||
      !patient.lastName ||
      !patient.username ||
      !patient.password ||
      !patient.nationalityId ||
      !patient.dateOfBirth ||
      !patient.email ||
      !patient.phone
    ) {
      alert("Por favor complete todos los campos obligatorios.")
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(patient.email)) {
      alert("Por favor ingrese un email válido.")
      return
    }

    setIsSaving(true)

    try {
      const patientData = {
        first_name: patient.firstName,
        last_name: patient.lastName,
        username: patient.username,
        password: patient.password,
        nationality_id: Number.parseInt(patient.nationalityId),
        date_of_birth: patient.dateOfBirth,
        email: patient.email,
        phone: patient.phone,
      }

      console.log("Creando paciente:", patientData)

      const response = await fetch(`${config.API_BASE_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error("Error al crear el paciente")
      }

      const result = await response.json()
      console.log("Paciente creado:", result)

      alert("Paciente creado exitosamente")
      // Redirigir a la lista de pacientes
      router.push("/admin/patients")
    } catch (error) {
      console.error("Error creating patient:", error)
      alert("Error al crear el paciente. Por favor, inténtelo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/admin/patients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo paciente</h1>
            <p className="text-muted-foreground">Registre un nuevo paciente en el sistema</p>
          </div>
        </div>
        { !isViewer && (
          <Button onClick={savePatient} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar paciente
              </>
            )}
          </Button>
        )}
      </div>

      { isViewer && (
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Atención</h4>
          <p className="text-sm text-yellow-800">No tiene permisos para crear pacientes.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del paciente</CardTitle>
          <CardDescription>Ingrese los datos básicos del paciente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={patient.firstName}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre"
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={patient.lastName}
                onChange={handleInputChange}
                placeholder="Ingrese el apellido"
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Nombre de usuario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                value={patient.username}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre de usuario"
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={patient.password}
                onChange={handleInputChange}
                placeholder="Ingrese la contraseña"
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationalityId">
                Nacionalidad <span className="text-red-500">*</span>
              </Label>
              <Select
                value={patient.nationalityId}
                onValueChange={(value) => handleSelectChange("nationalityId", value)}
                disabled={isLoadingNationalities || isViewer}
              >
                <SelectTrigger id="nationalityId">
                  <SelectValue placeholder={isLoadingNationalities ? "Cargando..." : "Seleccione nacionalidad"} />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map((nationality) => (
                    <SelectItem key={nationality.id} value={nationality.id.toString()}>
                      {nationality.name_es}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Fecha de nacimiento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={patient.dateOfBirth}
                onChange={handleInputChange}
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Correo electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={patient.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                value={patient.phone}
                onChange={handleInputChange}
                placeholder="+54 11 1234-5678"
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Información importante</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Todos los campos marcados con (*) son obligatorios</li>
              <li>• El nombre de usuario debe ser único en el sistema</li>
              <li>• La contraseña debe tener al menos 6 caracteres</li>
              <li>• El email debe tener un formato válido</li>
              <li>• El teléfono debe incluir el código de país</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/patients">
          <Button variant="outline">Cancelar</Button>
        </Link>
        { !isViewer && (
          <Button onClick={savePatient} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar paciente
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
