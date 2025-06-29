"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, CheckCircle, Search, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { patientProtocolApi } from "@/lib/patient-api"
import { patientAuthUtils } from "@/lib/patient-auth"
import { config } from "@/lib/config"

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
  delay_days: number
  available_date: string
  days_until_available?: number
}

interface ProtocolForm {
  id: number
  protocol_id: number
  form_id: number
  previous_form_id: number | null
  delay_days: number
  repeat_count: number
  repeat_interval_days: number
  order_in_protocol: number
  form_name_es: string
  form_name_en: string
}

export default function PatientFormsPage() {
  const [availableForms, setAvailableForms] = useState<FormWithStatus[]>([])
  const [filteredForms, setFilteredForms] = useState<FormWithStatus[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("available")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Función para calcular si un formulario está disponible
  const isFormAvailable = (
    startDate: string,
    delayDays: number,
  ): { available: boolean; daysUntil?: number; availableDate: string } => {
    console.log(`\n=== CALCULANDO DISPONIBILIDAD ===`)
    console.log("Start date (raw):", startDate)
    console.log("Delay days:", delayDays)

    // Crear fecha de inicio del protocolo
    const protocolStart = new Date(startDate)
    console.log("Protocol start:", protocolStart.toISOString())

    // Crear fecha disponible sumando delay_days
    const availableDate = new Date(protocolStart)
    availableDate.setDate(availableDate.getDate() + delayDays)
    console.log("Available date:", availableDate.toISOString())

    // Fecha actual
    const today = new Date()
    console.log("Today:", today.toISOString())

    // Comparación simple: ¿hoy es mayor o igual a la fecha disponible?
    const available = today >= availableDate
    console.log("Is available?", available)

    // Calcular días restantes si no está disponible
    let daysUntil = 0
    if (!available) {
      const diffTime = availableDate.getTime() - today.getTime()
      daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      console.log("Days until available:", daysUntil)
    }

    const result = {
      available,
      daysUntil: available ? undefined : daysUntil,
      availableDate: availableDate.toISOString(),
    }

    console.log("Final result:", result)
    console.log("=== FIN CÁLCULO ===\n")
    return result
  }

  useEffect(() => {
    const loadPatientForms = async () => {
      try {
        setIsLoading(true)
        setError("")

        console.log("=== CARGANDO FORMULARIOS DEL PACIENTE ===")

        // Obtener el ID del paciente
        const patient = patientAuthUtils.getPatient()
        console.log("Patient data from auth utils:", patient)

        if (!patient || !patient.id) {
          throw new Error("No se encontró información del paciente")
        }

        const patientId = patient.id
        console.log("Patient ID:", patientId)

        // 1. Obtener protocolos del paciente
        console.log(`1. GET ${config.API_BASE_URL}/patient-protocols/patient/${patientId}`)
        const patientProtocols = await patientProtocolApi.getMyProtocols(patientId)
        console.log("Protocolos obtenidos:", patientProtocols)

        if (!patientProtocols || patientProtocols.length === 0) {
          console.log("No se encontraron protocolos para el paciente")
          setAvailableForms([])
          setIsLoading(false)
          return
        }

        // 2. Para cada protocolo, obtener sus formularios y verificar disponibilidad
        const allForms: FormWithStatus[] = []

        for (const protocol of patientProtocols) {
          try {
            console.log(`\n=== PROCESANDO PROTOCOLO ${protocol.protocol_id} ===`)
            console.log("Protocolo completo:", protocol)

            // Obtener formularios del protocolo
            const protocolFormsUrl = `${config.API_BASE_URL}/protocols/${protocol.protocol_id}/forms`
            console.log(`2a. GET ${protocolFormsUrl}`)

            const response = await fetch(protocolFormsUrl, {
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                ...(localStorage.getItem(config.PATIENT_TOKEN_KEY) && {
                  Authorization: `Bearer ${localStorage.getItem(config.PATIENT_TOKEN_KEY)}`,
                }),
              },
            })

            if (!response.ok) {
              console.error(`Error obteniendo formularios del protocolo ${protocol.protocol_id}:`, response.status)
              continue
            }

            const protocolForms: ProtocolForm[] = await response.json()
            console.log(`Formularios del protocolo ${protocol.protocol_id}:`, protocolForms)

            // Obtener formularios ya respondidos
            const respondedUrl = `${config.API_BASE_URL}/protocols/${protocol.protocol_id}/responded/${patientId}`
            console.log(`2b. GET ${respondedUrl}`)
            const respondedForms = await patientProtocolApi.getRespondedForms(protocol.protocol_id, patientId)
            console.log(`Formularios respondidos del protocolo ${protocol.protocol_id}:`, respondedForms)

            // 3. Procesar cada formulario del protocolo
            for (const protocolForm of protocolForms) {
              console.log(`\n--- Procesando formulario: ${protocolForm.form_name_es} ---`)
              console.log("Form ID:", protocolForm.form_id)
              console.log("Delay days:", protocolForm.delay_days)
              console.log("Protocol start date:", protocol.start_date)

              // Verificar disponibilidad basada en start_date + delay_days
              const availability = isFormAvailable(protocol.start_date, protocolForm.delay_days)

              // Verificar si ya fue completado
              const isCompleted = respondedForms.some((rf) => rf.id === protocolForm.form_id)
              console.log("¿Ya completado?", isCompleted)

              const formWithStatus: FormWithStatus = {
                id: protocolForm.form_id,
                title: protocolForm.form_name_es,
                description: `Formulario del protocolo ${protocol.protocol_name_es}`,
                protocol_name: protocol.protocol_name_es,
                protocol_id: protocol.protocol_id,
                patient_protocol_id: protocol.id,
                is_available: availability.available && !isCompleted,
                is_completed: isCompleted,
                start_date: protocol.start_date,
                delay_days: protocolForm.delay_days,
                available_date: availability.availableDate,
                days_until_available: availability.daysUntil,
              }

              console.log("Formulario procesado final:", formWithStatus)
              allForms.push(formWithStatus)

              console.log("=== DEBUG FORMULARIO ===")
              console.log("Form title:", protocolForm.form_name_es)
              console.log("Protocol start date:", protocol.start_date)
              console.log("Delay days:", protocolForm.delay_days)
              console.log("Availability result:", availability)
              console.log("Is completed:", isCompleted)
              console.log("Final is_available:", availability.available && !isCompleted)
              console.log("========================")
            }
          } catch (error) {
            console.error(`Error procesando protocolo ${protocol.protocol_id}:`, error)
          }
        }

        console.log("\n=== FORMULARIOS FINALES ===")
        console.log("Total formularios:", allForms.length)
        console.log("Formularios disponibles:", allForms.filter((f) => f.is_available).length)
        console.log("Formularios completados:", allForms.filter((f) => f.is_completed).length)
        console.log("Formularios pendientes:", allForms.filter((f) => !f.is_available && !f.is_completed).length)

        // Log detallado de cada formulario
        allForms.forEach((form, index) => {
          console.log(`Formulario ${index + 1}:`, {
            title: form.title,
            is_available: form.is_available,
            is_completed: form.is_completed,
            days_until_available: form.days_until_available,
            start_date: form.start_date,
            delay_days: form.delay_days,
          })
        })

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
      filtered = filtered.filter((form) => form.is_available)
    } else if (statusFilter === "completed") {
      filtered = filtered.filter((form) => form.is_completed)
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((form) => !form.is_available && !form.is_completed)
    }

    setFilteredForms(filtered)
  }, [availableForms, searchTerm, statusFilter])

  const getStatusBadge = (form: FormWithStatus) => {
    if (form.is_completed) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">Completado</Badge>
    } else if (form.is_available) {
      return <Badge className="bg-green-100 text-green-800 text-xs">A responder</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>
    }
  }

  const availableCount = availableForms.filter((f) => f.is_available).length
  const completedCount = availableForms.filter((f) => f.is_completed).length
  const pendingCount = availableForms.filter((f) => !f.is_available && !f.is_completed).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formularios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar formularios</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Formularios</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Complete los formularios asignados a sus protocolos médicos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">A responder</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{availableCount}</div>
              <p className="text-xs text-gray-600">Disponibles ahora</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-gray-600">Próximamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{completedCount}</div>
              <p className="text-xs text-gray-600">Ya respondidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar formularios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={statusFilter === "available" ? "default" : "outline"}
                  onClick={() => setStatusFilter("available")}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  A responder ({availableCount})
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => setStatusFilter("pending")}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Pendientes ({pendingCount})
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Completados ({completedCount})
                </Button>
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
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
                <p className="text-gray-600 text-sm">
                  {searchTerm || statusFilter !== "all"
                    ? "Intente ajustar los filtros de búsqueda"
                    : "No tiene formularios asignados en este momento"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredForms.map((form) => (
              <Card key={`${form.protocol_id}-${form.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{form.title}</h3>
                          {getStatusBadge(form)}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">Protocolo: {form.protocol_name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{form.description}</p>
                        <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                          <p>Inicio del protocolo: {new Date(form.start_date).toLocaleDateString()}</p>
                          <p>Días de espera: {form.delay_days}</p>
                          <p>Disponible desde: {new Date(form.available_date).toLocaleDateString()}</p>
                          {form.days_until_available && form.days_until_available > 0 && (
                            <p className="text-yellow-600 font-medium">
                              Disponible en {form.days_until_available} día{form.days_until_available > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="flex gap-2">
                        {form.is_completed ? (
                          <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completado
                          </Button>
                        ) : form.is_available ? (
                          <Link
                            href={`/patient/forms/${form.id}?protocol_id=${form.protocol_id}&patient_protocol_id=${form.patient_protocol_id}`}
                          >
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm min-h-[36px]">
                              <FileText className="h-4 w-4 mr-2" />
                              Completar
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm">
                            <Clock className="h-4 w-4 mr-2" />
                            No disponible
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
