"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2, Calendar, FileText, CheckCircle, X, AlertTriangle, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { nationalitiesApi } from "@/lib/api"
import { config } from "@/lib/config"

interface PatientProtocol {
  id: number
  patient_id: number
  protocol_id: number
  start_date: string
  assigned_by: number
  protocol_name_es: string
  protocol_name_en: string
}

interface Protocol {
  id: number
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  created_at: string
  updated_at: string
}

interface ProtocolForm {
  id: number
  key_name: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  created_at: string
  updated_at: string
}

interface PendingChanges {
  protocolsToAdd: Array<{
    protocol_id: number
    start_date: string
  }>
  protocolsToRemove: number[]
}

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = Number.parseInt(params.id as string)

  const [nationalities, setNationalities] = useState([])
  const [availableProtocols, setAvailableProtocols] = useState<Protocol[]>([])
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true)
  const [isLoadingPatient, setIsLoadingPatient] = useState(true)
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(true)
  const [isLoadingAvailableProtocols, setIsLoadingAvailableProtocols] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedProtocolId, setSelectedProtocolId] = useState("")
  const [startDate, setStartDate] = useState("")

  const [patient, setPatient] = useState({
    firstName: "",
    lastName: "",
    nationalityId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
  })

  const [originalPatientProtocols, setOriginalPatientProtocols] = useState<PatientProtocol[]>([])
  const [patientProtocols, setPatientProtocols] = useState<PatientProtocol[]>([])
  const [protocolForms, setProtocolForms] = useState<
    Record<number, { available: ProtocolForm[]; responded: ProtocolForm[] }>
  >({})

  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    protocolsToAdd: [],
    protocolsToRemove: [],
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
        const patientResponse = await fetch(`${config.API_BASE_URL}/patients/${patientId}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!patientResponse.ok) {
          throw new Error("Error al cargar datos del paciente")
        }

        const patientData = await patientResponse.json()
        setPatient({
          firstName: patientData.first_name || "",
          lastName: patientData.last_name || "",
          nationalityId: patientData.nationality_id?.toString() || "",
          dateOfBirth: patientData.date_of_birth ? patientData.date_of_birth.split("T")[0] : "",
          email: patientData.email || "",
          phone: patientData.phone || "",
        })

        // Cargar protocolos del paciente
        setIsLoadingProtocols(true)
        const protocolsResponse = await fetch(`${config.API_BASE_URL}/patient-protocols/patient/${patientId}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (protocolsResponse.ok) {
          const protocols = await protocolsResponse.json()
          setOriginalPatientProtocols(protocols)
          setPatientProtocols(protocols)

          // Cargar formularios para cada protocolo
          const formsData: Record<number, { available: ProtocolForm[]; responded: ProtocolForm[] }> = {}

          for (const protocol of protocols) {
            try {
              // Formularios disponibles
              const availableResponse = await fetch(
                `${config.API_BASE_URL}/protocols/${protocol.protocol_id}/available/${patientId}`,
                {
                  headers: {
                    "ngrok-skip-browser-warning": "true",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              )
              const availableForms = availableResponse.ok ? await availableResponse.json() : []

              // Formularios respondidos
              const respondedResponse = await fetch(
                `${config.API_BASE_URL}/protocols/${protocol.protocol_id}/responded/${patientId}`,
                {
                  headers: {
                    "ngrok-skip-browser-warning": "true",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              )
              const respondedForms = respondedResponse.ok ? await respondedResponse.json() : []

              formsData[protocol.protocol_id] = {
                available: availableForms,
                responded: respondedForms,
              }
            } catch (error) {
              console.error(`Error cargando formularios del protocolo ${protocol.protocol_id}:`, error)
              formsData[protocol.protocol_id] = { available: [], responded: [] }
            }
          }

          setProtocolForms(formsData)
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
        alert(`Error al cargar los datos del paciente: ${error.message}`)
      } finally {
        setIsLoadingNationalities(false)
        setIsLoadingPatient(false)
        setIsLoadingProtocols(false)
      }
    }

    if (patientId) {
      fetchData()
    }
  }, [patientId])

  const loadAvailableProtocols = async () => {
    console.log("Cargando protocolos disponibles...")
    setIsLoadingAvailableProtocols(true)
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const protocols = await response.json()
        console.log("Protocolos cargados:", protocols)

        // Filtrar protocolos que ya están asignados
        const assignedProtocolIds = patientProtocols.map((p) => p.protocol_id)
        const available = protocols.filter((p) => !assignedProtocolIds.includes(p.id))
        console.log("Protocolos disponibles después del filtro:", available)

        setAvailableProtocols(available)
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error cargando protocolos disponibles:", error)
      alert(`Error al cargar protocolos: ${error.message}`)
    } finally {
      setIsLoadingAvailableProtocols(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPatient({ ...patient, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setPatient({ ...patient, [name]: value })
  }

  const handleUnassignProtocol = (protocolId: number) => {
    // Verificar si es un protocolo recién agregado (pendiente)
    const isNewProtocol = pendingChanges.protocolsToAdd.some((p) => p.protocol_id === protocolId)

    if (isNewProtocol) {
      // Si es nuevo, solo removerlo de los pendientes a agregar
      setPendingChanges((prev) => ({
        ...prev,
        protocolsToAdd: prev.protocolsToAdd.filter((p) => p.protocol_id !== protocolId),
      }))
    } else {
      // Si es existente, agregarlo a los pendientes a remover
      setPendingChanges((prev) => ({
        ...prev,
        protocolsToRemove: [...prev.protocolsToRemove, protocolId],
      }))
    }

    // Actualizar la vista local
    setPatientProtocols((prev) => prev.filter((p) => p.protocol_id !== protocolId))

    // Remover formularios del protocolo
    setProtocolForms((prev) => {
      const updated = { ...prev }
      delete updated[protocolId]
      return updated
    })
  }

  const handleAssignProtocol = () => {
    if (!selectedProtocolId || !startDate) {
      alert("Por favor seleccione un protocolo y una fecha de inicio")
      return
    }

    const protocolId = Number.parseInt(selectedProtocolId)
    const selectedProtocol = availableProtocols.find((p) => p.id === protocolId)

    if (!selectedProtocol) {
      alert("Protocolo no encontrado")
      return
    }

    console.log("Asignando protocolo:", selectedProtocol)

    // Agregar a cambios pendientes
    setPendingChanges((prev) => ({
      ...prev,
      protocolsToAdd: [
        ...prev.protocolsToAdd,
        {
          protocol_id: protocolId,
          start_date: startDate,
        },
      ],
    }))

    // Crear protocolo temporal para mostrar en la UI
    const tempProtocol: PatientProtocol = {
      id: Date.now(), // ID temporal
      patient_id: patientId,
      protocol_id: protocolId,
      start_date: startDate,
      assigned_by: 0, // Se asignará en el backend
      protocol_name_es: selectedProtocol.name_es,
      protocol_name_en: selectedProtocol.name_en,
    }

    setPatientProtocols((prev) => [...prev, tempProtocol])

    // Limpiar formulario
    setSelectedProtocolId("")
    setStartDate("")
    setShowAssignDialog(false)
  }

  const saveAllChanges = async () => {
    // Validar campos obligatorios del paciente
    if (
      !patient.firstName ||
      !patient.lastName ||
      !patient.nationalityId ||
      !patient.dateOfBirth ||
      !patient.email ||
      !patient.phone
    ) {
      alert("Por favor complete todos los campos obligatorios del paciente.")
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
      // 1. Actualizar datos del paciente
      const patientData = {
        first_name: patient.firstName,
        last_name: patient.lastName,
        nationality_id: Number.parseInt(patient.nationalityId),
        date_of_birth: patient.dateOfBirth,
        email: patient.email,
        phone: patient.phone,
      }

      const patientResponse = await fetch(`${config.API_BASE_URL}/patients/${patientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(patientData),
      })

      if (!patientResponse.ok) {
        throw new Error("Error al actualizar datos del paciente")
      }

      // 2. Desasignar protocolos
      for (const protocolId of pendingChanges.protocolsToRemove) {
        const unassignResponse = await fetch(`${config.API_BASE_URL}/patient-protocols/eliminarPaciente`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            idPaciente: patientId,
            idProtocolo: protocolId,
          }),
        })

        if (!unassignResponse.ok) {
          console.error(`Error desasignando protocolo ${protocolId}`)
        }
      }

      // 3. Asignar nuevos protocolos
      for (const protocolToAdd of pendingChanges.protocolsToAdd) {
        const assignResponse = await fetch(`${config.API_BASE_URL}/patient-protocols`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            patient_id: patientId,
            protocol_id: protocolToAdd.protocol_id,
            start_date: protocolToAdd.start_date,
            assigned_by: Number.parseInt(localStorage.getItem("userId") || "1"), // ID del usuario actual
          }),
        })

        if (!assignResponse.ok) {
          console.error(`Error asignando protocolo ${protocolToAdd.protocol_id}`)
        }
      }

      // Limpiar cambios pendientes
      setPendingChanges({
        protocolsToAdd: [],
        protocolsToRemove: [],
      })

      alert("Todos los cambios se guardaron exitosamente")

      // Recargar datos para reflejar los cambios reales
      window.location.reload()
    } catch (error) {
      console.error("Error guardando cambios:", error)
      alert("Error al guardar los cambios. Por favor, inténtelo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = () => {
    return (
      pendingChanges.protocolsToAdd.length > 0 ||
      pendingChanges.protocolsToRemove.length > 0 ||
      JSON.stringify(patient) !==
        JSON.stringify({
          firstName: "",
          lastName: "",
          nationalityId: "",
          dateOfBirth: "",
          email: "",
          phone: "",
        })
    )
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
        <Button onClick={saveAllChanges} disabled={isSaving}>
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

      {/* Mostrar indicador de cambios pendientes */}
      {hasChanges() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Hay cambios pendientes. Haga clic en "Guardar cambios" para aplicarlos.
            </p>
          </div>
        </div>
      )}

      {/* Información del paciente */}
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
        </CardContent>
      </Card>

      {/* Protocolos asignados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Protocolos Asignados
              </CardTitle>
              <CardDescription>Protocolos médicos asignados a este paciente y sus formularios</CardDescription>
            </div>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    console.log("Botón asignar protocolo clickeado")
                    loadAvailableProtocols()
                    setShowAssignDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Protocolo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Protocolo</DialogTitle>
                  <DialogDescription>
                    Seleccione un protocolo y la fecha de inicio para asignarlo al paciente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="protocol">Protocolo</Label>
                    <Select
                      value={selectedProtocolId}
                      onValueChange={setSelectedProtocolId}
                      disabled={isLoadingAvailableProtocols}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingAvailableProtocols
                              ? "Cargando protocolos..."
                              : availableProtocols.length === 0
                                ? "No hay protocolos disponibles"
                                : "Seleccione un protocolo"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProtocols.map((protocol) => (
                          <SelectItem key={protocol.id} value={protocol.id.toString()}>
                            {protocol.name_es}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingAvailableProtocols && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando protocolos...
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAssignProtocol}
                    disabled={!selectedProtocolId || !startDate || isLoadingAvailableProtocols}
                  >
                    Asignar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProtocols ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando protocolos...</span>
            </div>
          ) : patientProtocols.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Este paciente no tiene protocolos asignados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patientProtocols.map((protocol) => {
                const isNewProtocol = pendingChanges.protocolsToAdd.some((p) => p.protocol_id === protocol.protocol_id)
                const isToBeRemoved = pendingChanges.protocolsToRemove.includes(protocol.protocol_id)

                return (
                  <Card
                    key={protocol.id}
                    className={`border-l-4 ${
                      isNewProtocol
                        ? "border-l-green-500 bg-green-50"
                        : isToBeRemoved
                          ? "border-l-red-500 bg-red-50 opacity-60"
                          : "border-l-blue-500"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {protocol.protocol_name_es}
                            {isNewProtocol && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Nuevo
                              </Badge>
                            )}
                            {isToBeRemoved && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                A eliminar
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Iniciado: {new Date(protocol.start_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnassignProtocol(protocol.protocol_id)}
                          disabled={isToBeRemoved}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {isToBeRemoved ? "Eliminado" : "Desasignar"}
                        </Button>
                      </div>
                    </CardHeader>
                    {!isNewProtocol && !isToBeRemoved && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Formularios a responder */}
                          <div>
                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-orange-500" />A responder (
                              {protocolForms[protocol.protocol_id]?.available?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {protocolForms[protocol.protocol_id]?.available?.length > 0 ? (
                                protocolForms[protocol.protocol_id].available.map((form) => (
                                  <div
                                    key={form.id}
                                    className="flex items-center justify-between p-2 bg-orange-50 rounded-lg"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{form.name_es}</p>
                                      <p className="text-xs text-gray-600">{form.description_es}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                      Pendiente
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic">No hay formularios pendientes</p>
                              )}
                            </div>
                          </div>

                          {/* Formularios completados */}
                          <div>
                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Completados ({protocolForms[protocol.protocol_id]?.responded?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {protocolForms[protocol.protocol_id]?.responded?.length > 0 ? (
                                protocolForms[protocol.protocol_id].responded.map((form) => (
                                  <div
                                    key={form.id}
                                    className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{form.name_es}</p>
                                      <p className="text-xs text-gray-600">{form.description_es}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                      Completado
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic">No hay formularios completados</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Información importante</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Todos los campos marcados con (*) son obligatorios</li>
          <li>• El email debe tener un formato válido</li>
          <li>• El teléfono debe incluir el código de país</li>
          <li>• La fecha de nacimiento debe ser anterior a la fecha actual</li>
          <li>• Los cambios en protocolos se aplicarán al guardar</li>
          <li>• Al desasignar un protocolo se perderán todas las respuestas asociadas</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/patients">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={saveAllChanges} disabled={isSaving}>
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
