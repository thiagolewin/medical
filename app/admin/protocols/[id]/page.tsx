"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Plus, Edit, Trash2, Search, Check, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { protocolsApi, formsApi, patientsApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"
import { config } from "@/lib/config"

interface Form {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

interface ProtocolForm {
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

interface Patient {
  id: number
  first_name: string
  last_name: string
  email: string
  date_of_birth: string
}

export default function EditProtocolPage() {
  const router = useRouter()
  const params = useParams()
  const protocolId = Number.parseInt(params.id as string)

  const [activeTab, setActiveTab] = useState("basic")
  const [protocol, setProtocol] = useState({
    keyName: "",
    nameEs: "",
    nameEn: "",
    descriptionEs: "",
    descriptionEn: "",
  })
  const [availableForms, setAvailableForms] = useState<Form[]>([])
  const [protocolForms, setProtocolForms] = useState<ProtocolForm[]>([])
  const [currentForm, setCurrentForm] = useState<ProtocolForm | null>(null)
  const [isEditingForm, setIsEditingForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Estados para pacientes
  const [patients, setPatients] = useState<Patient[]>([])
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([])
  const [selectedPatients, setSelectedPatients] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Cargar datos del protocolo
        const protocolData = await protocolsApi.getProtocol(protocolId)
        setProtocol({
          keyName: protocolData.key_name || "",
          nameEs: protocolData.name_es || "",
          nameEn: protocolData.name_en || "",
          descriptionEs: protocolData.description_es || "",
          descriptionEn: protocolData.description_en || "",
        })

        // Cargar formularios disponibles
        const forms = await formsApi.getForms()
        setAvailableForms(forms)

        // Cargar formularios del protocolo
        const protocolFormsData = await protocolsApi.getProtocolForms(protocolId)
        setProtocolForms(protocolFormsData)
      } catch (error) {
        console.error("Error cargando datos:", error)
        alert("Error al cargar el protocolo")
      } finally {
        setIsLoading(false)
      }
    }

    if (protocolId) {
      fetchData()
    }
  }, [protocolId])

  // Cargar pacientes cuando se cambie a la pestaña de pacientes
  useEffect(() => {
    if (activeTab === "patients") {
      const fetchPatients = async () => {
        try {
          setIsLoadingPatients(true)

          // Cargar todos los pacientes
          const allPatients = await patientsApi.getPatients()
          setPatients(allPatients || [])

          // Cargar pacientes ya asignados al protocolo usando el endpoint correcto
          const assignedResponse = await fetch(`${config.API_BASE_URL}/patient-protocols/protocol/${protocolId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
              Authorization: `Bearer ${localStorage.getItem(config.TOKEN_KEY)}`,
            },
          })

          if (assignedResponse.ok) {
            const assignedPatientsData = await assignedResponse.json()
            setAssignedPatients(assignedPatientsData || [])

            // Marcar como seleccionados los pacientes ya asignados
            const assignedIds = (assignedPatientsData || []).map((p: any) => p.patient_id || p.id)
            setSelectedPatients(assignedIds)
          } else {
            console.error("Error cargando pacientes asignados:", assignedResponse.statusText)
            setAssignedPatients([])
          }
        } catch (error) {
          console.error("Error cargando pacientes:", error)
          setPatients([])
          setAssignedPatients([])
        } finally {
          setIsLoadingPatients(false)
        }
      }

      fetchPatients()
    }
  }, [activeTab, protocolId])

  const handleProtocolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProtocol({ ...protocol, [name]: value })
  }

  const handleKeyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z_]/g, "")
    setProtocol({ ...protocol, keyName: value })
  }

  const addNewForm = () => {
    const usedFormIds = protocolForms.map((pf) => pf.form_id)
    const availableFormsForSelection = availableForms.filter((form) => !usedFormIds.includes(form.id))

    if (availableFormsForSelection.length === 0) {
      alert("No hay más formularios disponibles para agregar al protocolo.")
      return
    }

    const newForm: ProtocolForm = {
      protocol_id: protocolId,
      form_id: availableFormsForSelection[0].id,
      previous_form_id: null,
      delay_days: 0,
      repeat_count: 1,
      repeat_interval_days: 0,
      order_in_protocol: protocolForms.length + 1,
      form_name_es: availableFormsForSelection[0].name_es,
      form_name_en: availableFormsForSelection[0].name_en,
    }
    setCurrentForm(newForm)
    setIsEditingForm(true)
  }

  const editForm = (form: ProtocolForm) => {
    setCurrentForm({ ...form })
    setIsEditingForm(true)
  }

  const saveForm = () => {
    if (!currentForm) return

    // Validar campos obligatorios
    if (!currentForm.form_id) {
      alert("Por favor seleccione un formulario.")
      return
    }

    const updatedForms = protocolForms.some(
      (f) => f.form_id === currentForm.form_id && f.order_in_protocol === currentForm.order_in_protocol,
    )
      ? protocolForms.map((f) =>
          f.form_id === currentForm.form_id && f.order_in_protocol === currentForm.order_in_protocol ? currentForm : f,
        )
      : [...protocolForms, currentForm]

    setProtocolForms(updatedForms)
    setCurrentForm(null)
    setIsEditingForm(false)
  }

  const deleteForm = (formId: number, orderInProtocol: number) => {
    setProtocolForms(protocolForms.filter((f) => !(f.form_id === formId && f.order_in_protocol === orderInProtocol)))
  }

  const handleFormChange = (field: string, value: any) => {
    if (!currentForm) return
    setCurrentForm({ ...currentForm, [field]: value })
  }

  const togglePatientSelection = (patientId: number) => {
    if (selectedPatients.includes(patientId)) {
      setSelectedPatients(selectedPatients.filter((id) => id !== patientId))
    } else {
      setSelectedPatients([...selectedPatients, patientId])
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const saveProtocol = async () => {
    // Validar campos obligatorios del protocolo
    if (!protocol.keyName || !protocol.nameEs || !protocol.nameEn) {
      alert("Por favor complete todos los campos obligatorios del protocolo.")
      return
    }

    setIsSaving(true)

    try {
      // Actualizar información básica del protocolo
      const protocolData = {
        key_name: protocol.keyName,
        name_es: protocol.nameEs,
        name_en: protocol.nameEn,
        description_es: protocol.descriptionEs,
        description_en: protocol.descriptionEn,
      }

      console.log("Actualizando protocolo:", protocolData)
      await protocolsApi.updateProtocol(protocolId, protocolData)

      // Actualizar formularios del protocolo
      const formsData = {
        forms: protocolForms,
      }

      console.log("Actualizando formularios del protocolo:", formsData)
      await protocolsApi.updateProtocolForms(protocolId, formsData)

      // Actualizar asignaciones de pacientes usando el endpoint correcto
      if (activeTab === "patients") {
        const user = authUtils.getUser()
        const userId = user?.id || 1

        // Obtener pacientes actualmente asignados
        const currentlyAssignedIds = assignedPatients.map((p) => p.id)

        // Pacientes a asignar (nuevos)
        const patientsToAssign = selectedPatients.filter((id) => !currentlyAssignedIds.includes(id))

        // Pacientes a desasignar (removidos)
        const patientsToUnassign = currentlyAssignedIds.filter((id) => !selectedPatients.includes(id))

        // Asignar nuevos pacientes
        for (const patientId of patientsToAssign) {
          const assignData = {
            patient_id: patientId,
            protocol_id: protocolId,
            start_date: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD
            assigned_by: userId,
          }

          console.log("Asignando paciente:", assignData)

          const assignResponse = await fetch(`${config.API_BASE_URL}/patient-protocols`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
              Authorization: `Bearer ${localStorage.getItem(config.TOKEN_KEY)}`,
            },
            body: JSON.stringify(assignData),
          })

          if (!assignResponse.ok) {
            const errorText = await assignResponse.text()
            console.error(`Error asignando paciente ${patientId}:`, errorText)
          }
        }

        // Desasignar pacientes removidos
        for (const patientId of patientsToUnassign) {
          const unassignResponse = await fetch(`${config.API_BASE_URL}/patient-protocols/eliminarPaciente`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
              Authorization: `Bearer ${localStorage.getItem(config.TOKEN_KEY)}`,
            },
            body: JSON.stringify({
              idPaciente: patientId,
              idProtocolo: protocolId,
            }),
          })

          if (!unassignResponse.ok) {
            console.error(`Error desasignando paciente ${patientId}`)
          }
        }
      }

      console.log("Protocolo actualizado exitosamente")

      // Redirigir a la lista de protocolos
      router.push("/admin/protocols")
    } catch (error) {
      console.error("Error updating protocol:", error)
      alert("Error al actualizar el protocolo. Por favor, inténtelo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const getFormName = (formId: number) => {
    const form = availableForms.find((f) => f.id === formId)
    return form ? form.name_es : "Formulario no encontrado"
  }

  // Obtener formularios disponibles para el selector (excluyendo los ya seleccionados)
  const getFormsForSelector = () => {
    const usedFormIds = protocolForms
      .filter(
        (pf) =>
          !currentForm ||
          !(pf.form_id === currentForm.form_id && pf.order_in_protocol === currentForm.order_in_protocol),
      )
      .map((pf) => pf.form_id)

    return availableForms.filter((form) => !usedFormIds.includes(form.id))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando protocolo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/admin/protocols">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar protocolo</h1>
            <p className="text-muted-foreground">Modifique la información del protocolo</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Información básica</TabsTrigger>
          <TabsTrigger value="forms">Formularios</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del protocolo</CardTitle>
              <CardDescription>Modifique la información básica del protocolo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Clave única</Label>
                <Input
                  id="keyName"
                  name="keyName"
                  placeholder="ej: post_surgery_protocol"
                  value={protocol.keyName}
                  onChange={handleKeyNameChange}
                />
                <p className="text-sm text-muted-foreground">
                  Identificador único para el protocolo (solo letras minúsculas y guiones bajos)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEs">Nombre (Español)</Label>
                  <Input
                    id="nameEs"
                    name="nameEs"
                    placeholder="ej: Protocolo Post-operatorio"
                    value={protocol.nameEs}
                    onChange={handleProtocolChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">Nombre (Inglés)</Label>
                  <Input
                    id="nameEn"
                    name="nameEn"
                    placeholder="ej: Post-surgery Protocol"
                    value={protocol.nameEn}
                    onChange={handleProtocolChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEs">Descripción (Español)</Label>
                  <Textarea
                    id="descriptionEs"
                    name="descriptionEs"
                    placeholder="Descripción del protocolo..."
                    value={protocol.descriptionEs}
                    onChange={handleProtocolChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Descripción (Inglés)</Label>
                  <Textarea
                    id="descriptionEn"
                    name="descriptionEn"
                    placeholder="Protocol description..."
                    value={protocol.descriptionEn}
                    onChange={handleProtocolChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Formularios del protocolo</h2>
            <Button onClick={addNewForm} disabled={isEditingForm}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir formulario
            </Button>
          </div>

          {isEditingForm && currentForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {protocolForms.some(
                    (f) => f.form_id === currentForm.form_id && f.order_in_protocol === currentForm.order_in_protocol,
                  )
                    ? "Editar formulario"
                    : "Nuevo formulario"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="formId">Formulario</Label>
                  <Select
                    value={currentForm.form_id.toString()}
                    onValueChange={(value) => {
                      const selectedForm = availableForms.find((f) => f.id === Number.parseInt(value))
                      if (selectedForm) {
                        handleFormChange("form_id", Number.parseInt(value))
                        handleFormChange("form_name_es", selectedForm.name_es)
                        handleFormChange("form_name_en", selectedForm.name_en)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un formulario" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFormsForSelector().map((form) => (
                        <SelectItem key={form.id} value={form.id.toString()}>
                          {form.name_es}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousFormId">Formulario anterior (opcional)</Label>
                  <Select
                    value={currentForm.previous_form_id?.toString() || "0"}
                    onValueChange={(value) =>
                      handleFormChange("previous_form_id", value ? Number.parseInt(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ninguno (primer formulario)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ninguno (primer formulario)</SelectItem>
                      {protocolForms
                        .filter(
                          (f) =>
                            !(
                              f.form_id === currentForm.form_id && f.order_in_protocol === currentForm.order_in_protocol
                            ),
                        )
                        .map((form) => (
                          <SelectItem key={`${form.form_id}-${form.order_in_protocol}`} value={form.form_id.toString()}>
                            {form.form_name_es}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delayDays">Días de retraso</Label>
                    <Input
                      id="delayDays"
                      type="number"
                      min="0"
                      value={currentForm.delay_days}
                      onChange={(e) => handleFormChange("delay_days", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repeatCount">Repeticiones</Label>
                    <Input
                      id="repeatCount"
                      type="number"
                      min="1"
                      value={currentForm.repeat_count}
                      onChange={(e) => handleFormChange("repeat_count", Number.parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repeatIntervalDays">Intervalo entre repeticiones (días)</Label>
                    <Input
                      id="repeatIntervalDays"
                      type="number"
                      min="0"
                      value={currentForm.repeat_interval_days}
                      onChange={(e) => handleFormChange("repeat_interval_days", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentForm(null)
                    setIsEditingForm(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={saveForm}>Guardar formulario</Button>
              </CardFooter>
            </Card>
          )}

          {protocolForms.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Formularios del protocolo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {protocolForms.map((form, index) => (
                    <div
                      key={`${form.form_id}-${form.order_in_protocol}`}
                      className="flex items-center justify-between border p-4 rounded-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {index + 1}. {form.form_name_es}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Retraso:</span> {form.delay_days} días
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Repeticiones:</span> {form.repeat_count}
                          {form.repeat_interval_days > 0 && ` (cada ${form.repeat_interval_days} días)`}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => editForm(form)} disabled={isEditingForm}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteForm(form.form_id, form.order_in_protocol)}
                          disabled={isEditingForm}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="mb-4 text-muted-foreground">No hay formularios en este protocolo.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patients" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignar pacientes al protocolo</CardTitle>
              <CardDescription>Seleccione los pacientes que desea asignar a este protocolo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar pacientes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {isLoadingPatients ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">No se encontraron pacientes</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-1 divide-y">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer ${
                          selectedPatients.includes(patient.id) ? "bg-muted/50" : ""
                        }`}
                        onClick={() => togglePatientSelection(patient.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedPatients.includes(patient.id)}
                            onCheckedChange={() => togglePatientSelection(patient.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <p className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(patient.date_of_birth).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatients.length > 0 && (
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    <span>
                      {selectedPatients.length} paciente{selectedPatients.length !== 1 ? "s" : ""} seleccionado
                      {selectedPatients.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPatients([])}>
                    Limpiar selección
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/protocols">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={saveProtocol} disabled={isSaving}>
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
