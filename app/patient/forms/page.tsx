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
  name_es: string
  name_en: string
  title: string
  description: string
  protocol_name: string
  protocol_id: number
  patient_protocol_id: number
  protocolform: number // <--- Cambiado para coincidir con el backend
  is_available: boolean
  is_completed: boolean
  start_date: string
  delay_days: number
  available_date: string
  days_until_available?: number
  order_in_protocol?: number
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
  const [pendingForms, setPendingForms] = useState<FormWithStatus[]>([])
  const [completedForms, setCompletedForms] = useState<FormWithStatus[]>([])
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
    const fetchWithCheck = async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Error al cargar: ${url}`)
      return res.json()
    }

    const loadPatientForms = async () => {
      try {
        setIsLoading(true)
        setError("")

        // Obtener el ID del paciente
        const patient = patientAuthUtils.getPatient()
        if (!patient || !patient.id) {
          throw new Error("No se encontró información del paciente")
        }
        const patientId = patient.id

        // 1. Obtener protocolos asignados al paciente
        const patientProtocols = await fetchWithCheck(`${config.API_BASE_URL}/patient-protocols/patient/${patientId}`)
        // patientProtocols: [{ id: patient_protocol_id, protocol_id, ... }]

        // Helper para buscar patient_protocol_id por protocolo
        const getPatientProtocolId = (protocol_id: number) => {
          const found = patientProtocols.find((p: any) => p.protocol_id === protocol_id)
          return found ? found.id : null
        }

        // Helper para mapear los datos de la API a lo que espera el front
        const mapForm = (form: any, estado: 'available' | 'pending' | 'completed'): FormWithStatus => {
          // Usar directamente los campos de la API si existen
          const protocol_id = form.protocol_id || form.protocolid || 0
          const patient_protocol_id = form.patient_protocol_id || form.patientprotocolid || 0

          // Calcular la fecha de disponibilidad real: start_date + delay_days
          const protocolStart = new Date(form.start_date)
          const availableDate = new Date(protocolStart)
          availableDate.setDate(availableDate.getDate() + (form.delay_days || 0))
          const today = new Date()
          const available_date = availableDate.toISOString()
          let days_until_available: number | undefined = undefined
          if (today < availableDate) {
            const diffTime = availableDate.getTime() - today.getTime()
            days_until_available = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          }

          return {
            id: form.id,
            name_es: form.name_es,
            name_en: form.name_en,
            title: form.name_es,
            description: form.description_es,
            protocol_name: form.key_name || '',
            protocol_id: protocol_id,
            patient_protocol_id: patient_protocol_id,
            protocolform: form.protocolform, // <--- Cambiado para coincidir con el backend
            is_available: estado === 'available',
            is_completed: estado === 'completed',
            start_date: form.start_date,
            delay_days: form.delay_days,
            available_date: available_date,
            days_until_available: days_until_available,
            order_in_protocol: form.order_in_protocol || form.orderInProtocol || 0,
          }
        }

        // Obtener forms disponibles
        const availableRaw = await fetchWithCheck(`${config.API_BASE_URL}/patients/avaiables/${patientId}`)
        const available = Array.isArray(availableRaw) ? availableRaw.map(f => mapForm(f, 'available')) : []
        setAvailableForms(available)

        // Obtener forms pendientes
        const pendingRaw = await fetchWithCheck(`${config.API_BASE_URL}/patients/pending/${patientId}`)
        const pending = Array.isArray(pendingRaw) ? pendingRaw.map(f => mapForm(f, 'pending')) : []
        setPendingForms(pending)

        // Obtener forms completados
        const completedRaw = await fetchWithCheck(`${config.API_BASE_URL}/patients/completados/${patientId}`)
        const completed = Array.isArray(completedRaw) ? completedRaw.map(f => mapForm(f, 'completed')) : []
        setCompletedForms(completed)

        setIsLoading(false)
      } catch (err: any) {
        setError(err.message || "Error cargando formularios")
        setIsLoading(false)
      }
    }
    loadPatientForms()
  }, [])

  useEffect(() => {
    let filtered: FormWithStatus[] = []
    if (statusFilter === "available") {
      filtered = Array.isArray(availableForms) ? availableForms : []
    } else if (statusFilter === "completed") {
      filtered = Array.isArray(completedForms) ? completedForms : []
    } else if (statusFilter === "pending") {
      filtered = Array.isArray(pendingForms) ? pendingForms : []
    } else if (statusFilter === "all") {
      filtered = [
        ...(Array.isArray(availableForms) ? availableForms : []),
        ...(Array.isArray(pendingForms) ? pendingForms : []),
        ...(Array.isArray(completedForms) ? completedForms : [])
      ]
    }
    if (searchTerm) {
      filtered = filtered.filter((form) =>
        form.name_es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredForms(filtered)
  }, [availableForms, completedForms, pendingForms, searchTerm, statusFilter])

  const getStatusBadge = (form: FormWithStatus) => {
    if (form.is_completed) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">Completado</Badge>
    } else if (form.is_available) {
      return <Badge className="bg-green-100 text-green-800 text-xs">A responder</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>
    }
  }

  const availableCount = availableForms.length
  const completedCount = completedForms.length
  const pendingCount = pendingForms.length
  const allCount = availableForms.length + completedForms.length + pendingForms.length

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
                  Todos ({allCount})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de formularios */}
        <div className="space-y-4">
          {Array.isArray(filteredForms) && filteredForms.length === 0 ? (
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
            Array.isArray(filteredForms) && [...filteredForms].sort((a, b) => Number(a.order_in_protocol ?? 0) - Number(b.order_in_protocol ?? 0)).map((form) => (
              <Card key={form.protocolform} className="hover:shadow-md transition-shadow">
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
                          {form.days_until_available && form.days_until_available > 0 ? (
                            <p className="text-yellow-600 font-medium">
                              Disponible en {form.days_until_available} día{form.days_until_available > 1 ? "s" : ""} ({new Date(form.available_date).toLocaleDateString()})
                            </p>
                          ) : (
                            <p className="text-green-700 font-medium">
                              Disponible desde: {new Date(form.available_date).toLocaleDateString()}
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
                          <>
                            {console.log('Form:', form.id, 'protocol_id:', form.protocol_id, 'patient_protocol_id:', form.patient_protocol_id)}
                            {form.protocol_id && form.patient_protocol_id ? (
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
                                <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                                Datos incompletos
                              </Button>
                            )}
                          </>
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
