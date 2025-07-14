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
import { useLanguage } from "@/lib/language-context"

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

  const { language } = useLanguage();
  const t = {
    title: language === "es" ? "Nuevo paciente" : "New Patient",
    subtitle: language === "es" ? "Registre un nuevo paciente en el sistema" : "Register a new patient in the system",
    save: language === "es" ? "Guardar paciente" : "Save patient",
    saving: language === "es" ? "Guardando..." : "Saving...",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    info: language === "es" ? "Información del paciente" : "Patient Information",
    infoDesc: language === "es" ? "Ingrese los datos básicos del paciente" : "Enter the patient's basic information",
    firstName: language === "es" ? "Nombre" : "First Name",
    lastName: language === "es" ? "Apellido" : "Last Name",
    username: language === "es" ? "Nombre de usuario" : "Username",
    password: language === "es" ? "Contraseña" : "Password",
    nationality: language === "es" ? "Nacionalidad" : "Nationality",
    dob: language === "es" ? "Fecha de nacimiento" : "Date of Birth",
    email: language === "es" ? "Correo electrónico" : "Email",
    phone: language === "es" ? "Teléfono" : "Phone",
    required: language === "es" ? "*" : "*",
    requiredInfo: language === "es" ? "Todos los campos marcados con (*) son obligatorios" : "All fields marked with (*) are required",
    uniqueUsername: language === "es" ? "El nombre de usuario debe ser único en el sistema" : "Username must be unique in the system",
    passwordLength: language === "es" ? "La contraseña debe tener al menos 6 caracteres" : "Password must be at least 6 characters",
    emailFormat: language === "es" ? "El email debe tener un formato válido" : "Email must be valid",
    phoneFormat: language === "es" ? "El teléfono debe incluir el código de país" : "Phone must include country code",
    success: language === "es" ? "Paciente creado exitosamente" : "Patient created successfully",
    error: language === "es" ? "Error al crear el paciente. Por favor, inténtelo de nuevo." : "Error creating patient. Please try again.",
    loading: language === "es" ? "Cargando..." : "Loading...",
    noPermission: language === "es" ? "No tiene permisos para crear pacientes." : "You do not have permission to create patients.",
  };

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
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        { !isViewer && (
          <Button onClick={savePatient} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t.save}
              </>
            )}
          </Button>
        )}
      </div>

      { isViewer && (
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Atención</h4>
          <p className="text-sm text-yellow-800">{t.noPermission}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.info}</CardTitle>
          <CardDescription>{t.infoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {t.firstName} {t.required}
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={patient.firstName}
                onChange={handleInputChange}
                placeholder={`${t.firstName} ${t.required}`}
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                {t.lastName} {t.required}
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={patient.lastName}
                onChange={handleInputChange}
                placeholder={`${t.lastName} ${t.required}`}
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                {t.username} {t.required}
              </Label>
              <Input
                id="username"
                name="username"
                value={patient.username}
                onChange={handleInputChange}
                placeholder={`${t.username} ${t.required}`}
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t.password} {t.required}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={patient.password}
                onChange={handleInputChange}
                placeholder={`${t.password} ${t.required}`}
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationalityId">
                {t.nationality} {t.required}
              </Label>
              <Select
                value={patient.nationalityId}
                onValueChange={(value) => handleSelectChange("nationalityId", value)}
                disabled={isLoadingNationalities || isViewer}
              >
                <SelectTrigger id="nationalityId">
                  <SelectValue placeholder={isLoadingNationalities ? t.loading : `${t.nationality} ${t.required}`} />
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
                {t.dob} {t.required}
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
                {t.email} {t.required}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={patient.email}
                onChange={handleInputChange}
                placeholder={`${t.email}@ejemplo.com`}
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t.phone} {t.required}
              </Label>
              <Input
                id="phone"
                name="phone"
                value={patient.phone}
                onChange={handleInputChange}
                placeholder={`+54 11 1234-5678`}
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Información importante</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t.requiredInfo}</li>
              <li>• {t.uniqueUsername}</li>
              <li>• {t.passwordLength}</li>
              <li>• {t.emailFormat}</li>
              <li>• {t.phoneFormat}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/patients">
          <Button variant="outline">{t.cancel}</Button>
        </Link>
        { !isViewer && (
          <Button onClick={savePatient} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t.save}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
