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
import { authUtils } from "@/lib/auth"
import { useLanguage } from "@/lib/language-context"

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

  const [nationalities, setNationalities] = useState<Array<{
    id: number
    key_name: string
    name_es: string
    name_en: string
  }>>([])
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

  const [originalPatient, setOriginalPatient] = useState({
    firstName: "",
    lastName: "",
    nationalityId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
  })
  const [patientProtocols, setPatientProtocols] = useState<PatientProtocol[]>([])
  const [originalPatientProtocols, setOriginalPatientProtocols] = useState<PatientProtocol[]>([]);
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

        const patientData = await patientResponse.json();
        setPatient({
          firstName: patientData.data.first_name || "",
          lastName: patientData.data.last_name || "",
          nationalityId: patientData.data.nationality_id?.toString() || "",
          dateOfBirth: patientData.data.date_of_birth ? patientData.data.date_of_birth.split("T")[0] : "",
          email: patientData.data.email || "",
          phone: patientData.data.phone || "",
        })
        setOriginalPatient({
          firstName: patientData.data.first_name || "",
          lastName: patientData.data.last_name || "",
          nationalityId: patientData.data.nationality_id?.toString() || "",
          dateOfBirth: patientData.data.date_of_birth ? patientData.data.date_of_birth.split("T")[0] : "",
          email: patientData.data.email || "",
          phone: patientData.data.phone || "",
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
          const protocolsJson = await protocolsResponse.json();
          const protocols = protocolsJson.data;
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
              const availableFormsJson = availableResponse.ok ? await availableResponse.json() : { data: [] };
              const availableForms = availableFormsJson.data;

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
              const respondedFormsJson = respondedResponse.ok ? await respondedResponse.json() : { data: [] };
              const respondedForms = respondedFormsJson.data;

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
        alert(`Error al cargar los datos del paciente: ${error instanceof Error ? error.message : String(error)}`)
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
    try {
      const response = await fetch(`${config.API_BASE_URL}/protocols`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const protocols = await response.json()

        // Filtrar protocolos que ya están asignados
        const assignedProtocolIds = patientProtocols.map((p: PatientProtocol) => p.protocol_id)
        const available = protocols.filter((p: Protocol) => !assignedProtocolIds.includes(p.id))

        setAvailableProtocols(available)
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error cargando protocolos disponibles:", error)
      alert(`Error al cargar protocolos: ${error instanceof Error ? error.message : String(error)}`)
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
      // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
      const formatDateForBackend = (dateString: string) => {
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }

      // 1. Actualizar datos del paciente
      const patientData = {
        first_name: patient.firstName,
        last_name: patient.lastName,
        nationality_id: Number.parseInt(patient.nationalityId),
        date_of_birth: formatDateForBackend(patient.dateOfBirth),
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
        const errorText = await patientResponse.text()
        console.error("Error response:", errorText)
        throw new Error(`Error al actualizar datos del paciente: ${patientResponse.status} ${patientResponse.statusText}`)
      }

      const updatedPatient = await patientResponse.json()

      // 2. Desasignar protocolos
      for (const protocolId of pendingChanges.protocolsToRemove) {
        
        // Buscar el registro de asignación para obtener el ID correcto
        const assignmentRecord = originalPatientProtocols.find(p => p.protocol_id === protocolId)
        
        if (!assignmentRecord) {
          console.error(`No se encontró registro de asignación para protocolo ${protocolId}`)
          continue
        }

        const unassignResponse = await fetch(`${config.API_BASE_URL}/patient-protocols/${assignmentRecord.id}`, {
          method: "DELETE",
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!unassignResponse.ok) {
          const errorText = await unassignResponse.text()
          console.error(`Error desasignando protocolo ${protocolId}:`, errorText)
          throw new Error(`Error al desasignar protocolo ${protocolId}: ${unassignResponse.status} ${unassignResponse.statusText}`)
        }
      }

      // 3. Asignar nuevos protocolos
      for (const protocolToAdd of pendingChanges.protocolsToAdd) {
        
        const assignData = {
          patient_id: patientId,
          protocol_id: protocolToAdd.protocol_id,
          start_date: formatDateForBackend(protocolToAdd.start_date),
          assigned_by: Number.parseInt(localStorage.getItem("userId") || "1"), // ID del usuario actual
        }

        const assignResponse = await fetch(`${config.API_BASE_URL}/patient-protocols`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(assignData),
        })

        if (!assignResponse.ok) {
          const errorText = await assignResponse.text()
          console.error(`Error asignando protocolo ${protocolToAdd.protocol_id}:`, errorText)
          throw new Error(`Error al asignar protocolo ${protocolToAdd.protocol_id}: ${assignResponse.status} ${assignResponse.statusText}`)
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
      alert(`Error al guardar los cambios: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = () => {
    return (
      pendingChanges.protocolsToAdd.length > 0 ||
      pendingChanges.protocolsToRemove.length > 0 ||
      JSON.stringify(patient) !== JSON.stringify(originalPatient)
    )
  }

  const user = typeof window !== "undefined" ? authUtils.getUser() : null;
  const isViewer = user?.role === "viewer";

  const { language } = useLanguage();
  const t = {
    title: language === "es" ? "Editar paciente" : "Edit Patient",
    subtitle: language === "es" ? "Modifique la información del paciente" : "Edit patient information",
    save: language === "es" ? "Guardar cambios" : "Save changes",
    saving: language === "es" ? "Guardando..." : "Saving...",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    info: language === "es" ? "Información del paciente" : "Patient Information",
    infoDesc: language === "es" ? "Modifique los datos del paciente" : "Edit patient data",
    firstName: language === "es" ? "Nombre" : "First Name",
    lastName: language === "es" ? "Apellido" : "Last Name",
    nationality: language === "es" ? "Nacionalidad" : "Nationality",
    dob: language === "es" ? "Fecha de nacimiento" : "Date of Birth",
    email: language === "es" ? "Correo electrónico" : "Email",
    phone: language === "es" ? "Teléfono" : "Phone",
    required: language === "es" ? "*" : "*",
    requiredInfo: language === "es" ? "Todos los campos marcados con (*) son obligatorios" : "All fields marked with (*) are required",
    emailFormat: language === "es" ? "El email debe tener un formato válido" : "Email must be valid",
    phoneFormat: language === "es" ? "El teléfono debe incluir el código de país" : "Phone must include country code",
    dobFormat: language === "es" ? "La fecha de nacimiento debe ser anterior a la fecha actual" : "Date of birth must be before today",
    protocolAssigned: language === "es" ? "Protocolos Asignados" : "Assigned Protocols",
    protocolDesc: language === "es" ? "Protocolos médicos asignados a este paciente y sus formularios" : "Medical protocols assigned to this patient and their forms",
    assignProtocol: language === "es" ? "Asignar Protocolo" : "Assign Protocol",
    assign: language === "es" ? "Asignar" : "Assign",
    startDate: language === "es" ? "Fecha de inicio" : "Start Date",
    noProtocols: language === "es" ? "No hay protocolos disponibles" : "No protocols available",
    selectProtocol: language === "es" ? "Seleccione un protocolo" : "Select a protocol",
    loadingProtocols: language === "es" ? "Cargando protocolos..." : "Loading protocols...",
    pending: language === "es" ? "Pendiente" : "Pending",
    completed: language === "es" ? "Completado" : "Completed",
    remove: language === "es" ? "Desasignar" : "Unassign",
    removed: language === "es" ? "Eliminado" : "Removed",
    new: language === "es" ? "Nuevo" : "New",
    toRemove: language === "es" ? "A eliminar" : "To remove",
    importantInfo: language === "es" ? "Información importante" : "Important information",
    changesPending: language === "es" ? "Hay cambios pendientes. Haga clic en 'Guardar cambios' para aplicarlos." : "There are pending changes. Click 'Save changes' to apply them.",
    protocolsInfo: language === "es" ? "Los cambios en protocolos se aplicarán al guardar" : "Protocol changes will be applied on save",
    unassignWarning: language === "es" ? "Al desasignar un protocolo se perderán todas las respuestas asociadas" : "Unassigning a protocol will delete all associated responses",
  };

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
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        { !isViewer && (
          <Button onClick={saveAllChanges} disabled={isSaving}>
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

      {/* Mostrar indicador de cambios pendientes */}
      {hasChanges() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {t.changesPending}
            </p>
          </div>
        </div>
      )}

      {/* Información del paciente */}
      <Card>
        <CardHeader>
          <CardTitle>{t.info}</CardTitle>
          <CardDescription>{t.infoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t.firstName} {t.required}</Label>
              <Input
                id="firstName"
                name="firstName"
                value={patient.firstName}
                onChange={handleInputChange}
                placeholder={t.firstName}
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t.lastName} {t.required}</Label>
              <Input
                id="lastName"
                name="lastName"
                value={patient.lastName}
                onChange={handleInputChange}
                placeholder={t.lastName}
                required
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationalityId">{t.nationality} {t.required}</Label>
              <Select
                value={patient.nationalityId}
                onValueChange={(value) => handleSelectChange("nationalityId", value)}
                disabled={isLoadingNationalities || isViewer}
              >
                <SelectTrigger id="nationalityId">
                  <SelectValue placeholder={isLoadingNationalities ? "Cargando..." : t.selectProtocol} />
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
              <Label htmlFor="dateOfBirth">{t.dob} {t.required}</Label>
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
              <Label htmlFor="email">{t.email} {t.required}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={patient.email}
                onChange={handleInputChange}
                placeholder={t.email}
                required
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone} {t.required}</Label>
              <Input
                id="phone"
                name="phone"
                value={patient.phone}
                onChange={handleInputChange}
                placeholder={t.phone}
                required
                disabled={isViewer}
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
              <CardTitle className="flex items-center gap-2">{t.protocolAssigned}</CardTitle>
              <CardDescription>{t.protocolDesc}</CardDescription>
            </div>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    loadAvailableProtocols()
                    setShowAssignDialog(true)
                  }}
                  disabled={isViewer}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.assignProtocol}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.assignProtocol}</DialogTitle>
                  <DialogDescription>
                    {t.assignProtocol}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="protocol">{t.assignProtocol}</Label>
                    <Select
                      value={selectedProtocolId}
                      onValueChange={setSelectedProtocolId}
                      disabled={isLoadingAvailableProtocols || isViewer}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingAvailableProtocols
                              ? t.loadingProtocols
                              : availableProtocols.length === 0
                                ? t.noProtocols
                                : t.selectProtocol
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
                        {t.loadingProtocols}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t.startDate}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isViewer}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleAssignProtocol}
                    disabled={!selectedProtocolId || !startDate || isLoadingAvailableProtocols || isViewer}
                  >
                    {t.assign}
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
              <span>{t.loadingProtocols}</span>
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
                                {t.new}
                              </Badge>
                            )}
                            {isToBeRemoved && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                {t.toRemove}
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
                          disabled={isToBeRemoved || isViewer}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {isToBeRemoved ? t.removed : t.remove}
                        </Button>
                      </div>
                    </CardHeader>
                    {!isNewProtocol && !isToBeRemoved && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Formularios a responder */}
                          <div>
                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-orange-500" />{t.pending} (
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
                                      {t.pending}
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic">No hay formularios {t.pending}</p>
                              )}
                            </div>
                          </div>

                          {/* Formularios completados */}
                          <div>
                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {t.completed} ({protocolForms[protocol.protocol_id]?.responded?.length || 0})
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
                                      {t.completed}
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic">No hay formularios {t.completed}</p>
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
        <h4 className="text-sm font-medium text-blue-900 mb-2">{t.importantInfo}</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {t.requiredInfo}</li>
          <li>• {t.emailFormat}</li>
          <li>• {t.phoneFormat}</li>
          <li>• {t.dobFormat}</li>
          <li>• {t.protocolsInfo}</li>
          <li>• {t.unassignWarning}</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/patients">
          <Button variant="outline">{t.cancel}</Button>
        </Link>
        { !isViewer && (
          <Button onClick={saveAllChanges} disabled={isSaving}>
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
