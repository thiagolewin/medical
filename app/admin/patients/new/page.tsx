"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { patientsApi, nationalitiesApi } from "@/lib/api"

export default function NewPatientPage() {
  const router = useRouter()
  const [nationalities, setNationalities] = useState([])
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true)
  const [patient, setPatient] = useState({
    firstName: "",
    lastName: "",
    nationalityId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
  })

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

    try {
      const patientData = {
        first_name: patient.firstName,
        last_name: patient.lastName,
        nationality_id: Number.parseInt(patient.nationalityId),
        date_of_birth: patient.dateOfBirth,
        email: patient.email,
        phone: patient.phone,
      }

      console.log("Creando paciente:", patientData)
      const response = await patientsApi.createPatient(patientData)
      console.log("Paciente creado:", response)

      // Redirigir a la lista de pacientes
      router.push("/admin/patients")
    } catch (error) {
      console.error("Error creating patient:", error)
      alert("Error al crear el paciente. Por favor, inténtelo de nuevo.")
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
        <Button onClick={savePatient}>
          <Save className="mr-2 h-4 w-4" />
          Guardar paciente
        </Button>
      </div>

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
        <Button onClick={savePatient}>
          <Save className="mr-2 h-4 w-4" />
          Guardar paciente
        </Button>
      </div>
    </div>
  )
}
