"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { patientsApi, nationalitiesApi } from "@/lib/api"

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = Number.parseInt(params.id as string)

  const [nationalities, setNationalities] = useState([])
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true)
  const [isLoadingPatient, setIsLoadingPatient] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [patient, setPatient] = useState({
    firstName: "",
    lastName: "",
    nationalityId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar nacionalidades
        setIsLoadingNationalities(true)
        const nationalitiesResponse = await nationalitiesApi.getNationalities()
        setNationalities(nationalitiesResponse)

        // Cargar datos del paciente
        setIsLoadingPatient(true)
        const patientData = await patientsApi.getPatient(patientId)
        setPatient({
          firstName: patientData.first_name || "",
          lastName: patientData.last_name || "",
          nationalityId: patientData.nationality_id?.toString() || "",
          dateOfBirth: patientData.date_of_birth || "",
          email: patientData.email || "",
          phone: patientData.phone || "",
        })
      } catch (error) {
        console.error("Error cargando datos:", error)
        alert("Error al cargar los datos del paciente")
      } finally {
        setIsLoadingNationalities(false)
        setIsLoadingPatient(false)
      }
    }

    if (patientId) {
      fetchData()
    }
  }, [patientId])

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
        nationality_id: Number.parseInt(patient.nationalityId),
        date_of_birth: patient.dateOfBirth,
        email: patient.email,
        phone: patient.phone,
      }

      console.log("Actualizando paciente:", patientData)
      const response = await patientsApi.updatePatient(patientId, patientData)
      console.log("Paciente actualizado:", response)

      // Redirigir a la lista de pacientes
      router.push("/admin/patients")
    } catch (error) {
      console.error("Error updating patient:", error)
      alert("Error al actualizar el paciente. Por favor, inténtelo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando paciente...</p>
        </div>
      </div>
    )
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
            <h1 className="text-3xl font-bold tracking-tight">Editar paciente</h1>
            <p className="text-muted-foreground">Modifique la información del paciente</p>
          </div>
        </div>
        <Button onClick={savePatient} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del paciente</CardTitle>
          <CardDescription>Modifique los datos del paciente</CardDescription>
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
                disabled={isLoadingNationalities}
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
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Información importante</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Todos los campos marcados con (*) son obligatorios</li>
              <li>• El email debe tener un formato válido</li>
              <li>• El teléfono debe incluir el código de país</li>
              <li>• La fecha de nacimiento debe ser anterior a la fecha actual</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/patients">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={savePatient} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
