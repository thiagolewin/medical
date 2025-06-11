"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, CheckCircle, Search, AlertCircle } from "lucide-react"
import Link from "next/link"
import { patientProtocolApi } from "@/lib/patient-api"
import { patientAuthUtils } from "@/lib/patient-auth"

interface FormWithStatus {
  id: number
  title: string
  description: string
  protocol_name: string
  protocol_id: number
  patient_protocol_id: number
  is_available: boolean
  is_completed: boolean
  start_date: string
}

export default function PatientFormsPage() {
  const [availableForms, setAvailableForms] = useState<FormWithStatus[]>([])
  const [filteredForms, setFilteredForms] = useState<FormWithStatus[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("available")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPatientForms = async () => {
      try {
        setIsLoading(true)
        setError("")

        console.log("=== CARGANDO FORMULARIOS DEL PACIENTE ===")

        // Obtener el ID del paciente usando patientAuthUtils
        const patient = patientAuthUtils.getPatient()
        console.log("Patient data from auth utils:", patient)

        if (!patient || !patient.id) {
          console.error("No se encontró información del paciente en localStorage")
          console.log("Checking all localStorage keys:")
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            console.log(`- ${key}: ${localStorage.getItem(key)}`)
          }
          throw new Error("No se encontró información del paciente")
        }

        const patientId = patient.id
        console.log("Patient ID:", patientId)
        console.log("URL base:", "https://23a8-181-110-100-252.ngrok-free.app/api")

        // 1. Obtener protocolos del paciente
        const url = `https://23a8-181-110-100-252.ngrok-free.app/api/patient-protocols/patient/${patientId}`
        console.log(`1. GET ${url}`)
        const patientProtocols = await patientProtocolApi.getMyProtocols(patientId)
        console.log("Protocolos obtenidos:", patientProtocols)

        if (!patientProtocols || patientProtocols.length === 0) {
          console.log("No se encontraron protocolos para el paciente")
          setAvailableForms([])
          setIsLoading(false)
          return
        }

        // 2. Para cada protocolo, obtener formularios disponibles y respondidos
        const allForms: FormWithStatus[] = []

        for (const protocol of patientProtocols) {
          try {
            console.log(`Procesando protocolo:`, protocol)

            // Obtener formularios disponibles
            const availableUrl = `https://23a8-181-110-100-252.ngrok-free.app/api/protocols/${protocol.protocol_id}/available/${patientId}`
            console.log(`2a. GET ${availableUrl}`)
            const availableForms = await patientProtocolApi.getAvailableForms(protocol.protocol_id, patientId)
            console.log(`Formularios disponibles del protocolo ${protocol.protocol_id}:`, availableForms)

            // Obtener formularios respondidos
            const respondedUrl = `https://23a8-181-110-100-252.ngrok-free.app/api/protocols/${protocol.protocol_id}/responded/${patientId}`
            console.log(`2b. GET ${respondedUrl}`)
            const respondedForms = await patientProtocolApi.getRespondedForms(protocol.protocol_id, patientId)
            console.log(`Formularios respondidos del protocolo ${protocol.protocol_id}:`, respondedForms)

            // 3. Procesar formularios disponibles
            for (const form of availableForms) {
              console.log(`3a. Procesando formulario disponible: ${form.name_es}`)

              const formWithStatus: FormWithStatus = {
                id: form.id,
                title: form.name_es,
                description: form.description_es,
                protocol_name: protocol.protocol_name_es,
                protocol_id: protocol.protocol_id,
                patient_protocol_id: protocol.id,
                is_available: true,
                is_completed: false,
                start_date: protocol.start_date,
              }

              console.log(`Formulario disponible procesado:`, formWithStatus)
              allForms.push(formWithStatus)
            }

            // 4. Procesar formularios respondidos
            for (const form of respondedForms) {
              console.log(`4a. Procesando formulario respondido: ${form.name_es}`)

              const formWithStatus: FormWithStatus = {
                id: form.id,
                title: form.name_es,
                description: form.description_es,
                protocol_name: protocol.protocol_name_es,
                protocol_id: protocol.protocol_id,
                patient_protocol_id: protocol.id,
                is_available: false,
                is_completed: true,
                start_date: protocol.start_date,
              }

              console.log(`Formulario respondido procesado:`, formWithStatus)
              allForms.push(formWithStatus)
            }
          } catch (error) {
            console.error(`Error cargando formularios del protocolo ${protocol.protocol_id}:`, error)
          }
        }

        console.log("=== FORMULARIOS FINALES ===")
        console.log("Total formularios:", allForms.length)
        console.log("Formularios disponibles:", allForms.filter((f) => f.is_available && !f.is_completed).length)
        console.log("Formularios completados:", allForms.filter((f) => f.is_completed).length)

        setAvailableForms(allForms)
      } catch (error) {
        console.error("Error cargando formularios del paciente:", error)
        setError("Error al cargar los formularios. Por favor, inténtelo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadPatientForms()
  }, [])

  useEffect(() => {
    // Filtrar formularios basado en búsqueda y filtro de estado
    let filtered = availableForms

    if (searchTerm) {
      filtered = filtered.filter(
        (form) =>
          form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.protocol_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter === "available") {
      filtered = filtered.filter((form) => form.is_available && !form.is_completed)
    } else if (statusFilter === "completed") {
      filtered = filtered.filter((form) => form.is_completed)
    }

    setFilteredForms(filtered)
  }, [availableForms, searchTerm, statusFilter])

  const getStatusBadge = (form: FormWithStatus) => {
    if (form.is_completed) {
      return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>
    } else if (form.is_available) {
      return <Badge className="bg-green-100 text-green-800">Disponible</Badge>
    }
    return null
  }

  const availableCount = availableForms.filter((f) => f.is_available && !f.is_completed).length
  const completedCount = availableForms.filter((f) => f.is_completed).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formularios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar formularios</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Formularios</h1>
        <p className="text-gray-600 mt-2">Complete los formularios asignados a sus protocolos médicos</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <p className="text-xs text-gray-600">Listos para completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
            <p className="text-xs text-gray-600">Ya respondidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar formularios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "available" ? "default" : "outline"}
                onClick={() => setStatusFilter("available")}
                size="sm"
              >
                Disponibles ({availableCount})
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
              >
                Completados ({completedCount})
              </Button>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos ({availableForms.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de formularios */}
      <div className="space-y-4">
        {filteredForms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron formularios</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Intente ajustar los filtros de búsqueda"
                  : "No tiene formularios asignados en este momento"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredForms.map((form) => (
            <Card key={`${form.protocol_id}-${form.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                      {getStatusBadge(form)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Protocolo: {form.protocol_name}</p>
                    <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                    <div className="text-sm text-gray-500">
                      <p>Inicio del protocolo: {new Date(form.start_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <div className="flex gap-2">
                    {form.is_completed ? (
                      <Button variant="outline" size="sm" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completado
                      </Button>
                    ) : form.is_available ? (
                      <Link
                        href={`/patient/forms/${form.id}?protocol_id=${form.protocol_id}&patient_protocol_id=${form.patient_protocol_id}`}
                      >
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          <FileText className="h-4 w-4 mr-2" />
                          Completar Formulario
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
