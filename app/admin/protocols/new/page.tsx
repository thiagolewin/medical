"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Save, Trash2, Edit, ChevronRight, ChevronLeft, Search, Check, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { protocolsApi, formsApi, patientsApi, patientProtocolsApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"
import { Checkbox } from "@/components/ui/checkbox"

interface Form {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

interface ProtocolForm {
  id: number
  formId: number
  previousFormId: number | null
  delayDays: number
  repeatCount: number
  repeatIntervalDays: number
  orderInProtocol: number
}

interface Patient {
  id: number
  first_name: string
  last_name: string
  email: string
  date_of_birth: string
  selected?: boolean
}

export default function NewProtocolPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Paso 1: Información básica del protocolo
  const [protocol, setProtocol] = useState({
    keyName: "",
    nameEs: "",
    nameEn: "",
    descriptionEs: "",
    descriptionEn: "",
  })

  // Paso 2: Formularios del protocolo
  const [availableForms, setAvailableForms] = useState<Form[]>([])
  const [protocolForms, setProtocolForms] = useState<ProtocolForm[]>([])
  const [currentForm, setCurrentForm] = useState<ProtocolForm | null>(null)
  const [isEditingForm, setIsEditingForm] = useState(false)
  const [isLoadingForms, setIsLoadingForms] = useState(true)

  // Paso 3: Pacientes
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatients, setSelectedPatients] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)

  // Cargar formularios disponibles al montar el componente
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoadingForms(true)
        const forms = await formsApi.getForms()
        setAvailableForms(forms || [])
      } catch (error) {
        console.error("Error cargando formularios:", error)
        setAvailableForms([])
      } finally {
        setIsLoadingForms(false)
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [])

  // Cargar pacientes cuando se llegue al paso 3
  useEffect(() => {
    if (currentStep === 3) {
      const fetchPatients = async () => {
        try {
          setIsLoadingPatients(true)
          const response = await patientsApi.getPatients()
          setPatients(response || [])
        } catch (error) {
          console.error("Error cargando pacientes:", error)
          setPatients([])
        } finally {
          setIsLoadingPatients(false)
        }
      }

      fetchPatients()
    }
  }, [currentStep])

  // Obtener formularios disponibles (que no estén ya seleccionados)
  const getAvailableForms = () => {
    const selectedFormIds = protocolForms.map((pf) => pf.formId)
    return availableForms.filter((form) => !selectedFormIds.includes(form.id))
  }

  const handleProtocolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProtocol({ ...protocol, [name]: value })
  }

  const handleKeyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z_]/g, "")
    setProtocol({ ...protocol, keyName: value })
  }

  const addNewForm = () => {
    const availableFormsForSelection = getAvailableForms()

    if (availableFormsForSelection.length === 0) {
      alert("No hay más formularios disponibles para agregar al protocolo.")
      return
    }

    const newForm: ProtocolForm = {
      id: Date.now(),
      formId: availableFormsForSelection[0].id,
      previousFormId: null,
      delayDays: 0,
      repeatCount: 1,
      repeatIntervalDays: 0,
      orderInProtocol: protocolForms.length + 1,
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
    if (!currentForm.formId) {
      alert("Por favor seleccione un formulario.")
      return
    }

    const updatedForms = protocolForms.some((f) => f.id === currentForm.id)
      ? protocolForms.map((f) => (f.id === currentForm.id ? currentForm : f))
      : [...protocolForms, currentForm]

    setProtocolForms(updatedForms)
    setCurrentForm(null)
    setIsEditingForm(false)
  }

  const deleteForm = (id: number) => {
    setProtocolForms(protocolForms.filter((f) => f.id !== id))
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

  const getFormName = (formId: number) => {
    const form = availableForms.find((f) => f.id === formId)
    return form ? form.name_es : "Formulario no encontrado"
  }

  // Obtener formularios disponibles para el selector (excluyendo el actual si está editando)
  const getFormsForSelector = () => {
    const selectedFormIds = protocolForms
      .filter((pf) => !currentForm || pf.id !== currentForm.id)
      .map((pf) => pf.formId)

    return availableForms.filter((form) => !selectedFormIds.includes(form.id))
  }

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      // Validar campos obligatorios del protocolo
      if (!protocol.keyName || !protocol.nameEs || !protocol.nameEn) {
        alert("Por favor complete todos los campos obligatorios del protocolo.")
        return false
      }
      return true
    } else if (currentStep === 2) {
      // Validar que haya al menos un formulario
      if (protocolForms.length === 0) {
        alert("El protocolo debe tener al menos un formulario.")
        return false
      }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const saveProtocol = async () => {
    if (!validateCurrentStep()) return

    setIsSaving(true)

    try {
      // Crear el protocolo usando la API
      const protocolData = {
        key_name: protocol.keyName,
        name_es: protocol.nameEs,
        name_en: protocol.nameEn,
        description_es: protocol.descriptionEs,
        description_en: protocol.descriptionEn,
      }

      console.log("Creando protocolo:", protocolData)
      const protocolResponse = await protocolsApi.createProtocol(protocolData)
      console.log("Protocolo creado:", protocolResponse)

      const protocolId = protocolResponse.id

      // Ahora agregar los formularios al protocolo
      for (const form of protocolForms) {
        const formData = {
          previous_form_id: form.previousFormId,
          delay_days: form.delayDays,
          repeat_count: form.repeatCount,
          repeat_interval_days: form.repeatIntervalDays,
          order_in_protocol: form.orderInProtocol,
        }

        console.log("Agregando formulario al protocolo:", formData)
        await protocolsApi.addFormToProtocol(protocolId, form.formId, formData)
      }

      // Asignar pacientes al protocolo
      if (selectedPatients.length > 0) {
        const user = authUtils.getUser()
        const userId = user?.id || 1

        for (const patientId of selectedPatients) {
          await patientProtocolsApi.assignPatientToProtocol(patientId, protocolId, userId)
        }
      }

      // Redirigir a la lista de protocolos
      router.push("/admin/protocols")
    } catch (error) {
      console.error("Error creating protocol:", error)
      alert("Error al crear el protocolo. Por favor, inténtelo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Link href="/admin/protocols">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nuevo protocolo</h1>
            <p className="text-muted-foreground">Cree un nuevo protocolo médico</p>
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            1
          </div>
          <div className={`w-8 sm:w-12 h-1 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            2
          </div>
          <div className={`w-8 sm:w-12 h-1 ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            3
          </div>
        </div>
      </div>

      {/* Paso 1: Información básica del protocolo */}
      {currentStep === 1 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Información del protocolo</CardTitle>
            <CardDescription>Ingrese la información básica del protocolo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">
                Clave única <span className="text-red-500">*</span>
              </Label>
              <Input
                id="keyName"
                name="keyName"
                placeholder="ej: post_surgery_protocol"
                value={protocol.keyName}
                onChange={handleKeyNameChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Identificador único para el protocolo (solo letras minúsculas y guiones bajos)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEs">
                  Nombre (Español) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nameEs"
                  name="nameEs"
                  placeholder="ej: Protocolo Post-operatorio"
                  value={protocol.nameEs}
                  onChange={handleProtocolChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">
                  Nombre (Inglés) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  placeholder="ej: Post-surgery Protocol"
                  value={protocol.nameEn}
                  onChange={handleProtocolChange}
                  required
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
          <CardFooter className="flex justify-end">
            <Button onClick={nextStep}>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Paso 2: Formularios del protocolo */}
      {currentStep === 2 && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Formularios del protocolo</h2>
            <Button onClick={addNewForm} disabled={isEditingForm || isLoadingForms || getAvailableForms().length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir formulario
            </Button>
          </div>

          {isEditingForm && currentForm && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  {protocolForms.some((f) => f.id === currentForm.id) ? "Editar formulario" : "Nuevo formulario"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="formId">Formulario</Label>
                  <Select
                    value={currentForm.formId.toString()}
                    onValueChange={(value) => handleFormChange("formId", Number.parseInt(value))}
                    disabled={isLoadingForms}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isLoadingForms ? "Cargando formularios..." : "Seleccione un formulario"}
                      />
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
                    value={currentForm.previousFormId?.toString() || "0"}
                    onValueChange={(value) => handleFormChange("previousFormId", value ? Number.parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ninguno (primer formulario)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ninguno (primer formulario)</SelectItem>
                      {protocolForms
                        .filter((f) => f.id !== currentForm.id)
                        .map((form) => (
                          <SelectItem key={form.id} value={form.formId.toString()}>
                            {getFormName(form.formId)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delayDays">Días de retraso</Label>
                    <Input
                      id="delayDays"
                      type="number"
                      min="0"
                      value={currentForm.delayDays}
                      onChange={(e) => handleFormChange("delayDays", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repeatCount">Repeticiones</Label>
                    <Input
                      id="repeatCount"
                      type="number"
                      min="1"
                      value={currentForm.repeatCount}
                      onChange={(e) => handleFormChange("repeatCount", Number.parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repeatIntervalDays">Intervalo entre repeticiones (días)</Label>
                    <Input
                      id="repeatIntervalDays"
                      type="number"
                      min="0"
                      value={currentForm.repeatIntervalDays}
                      onChange={(e) => handleFormChange("repeatIntervalDays", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setCurrentForm(null)
                    setIsEditingForm(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" onClick={saveForm}>
                  Guardar formulario
                </Button>
              </CardFooter>
            </Card>
          )}

          {protocolForms.length > 0 ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Formularios del protocolo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {protocolForms.map((form, index) => (
                    <div
                      key={form.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-md gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {index + 1}. {getFormName(form.formId)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Retraso:</span> {form.delayDays} días
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Repeticiones:</span> {form.repeatCount}
                          {form.repeatIntervalDays > 0 && ` (cada ${form.repeatIntervalDays} días)`}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => editForm(form)} disabled={isEditingForm}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteForm(form.id)}
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
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="mb-4 text-muted-foreground">
                  No hay formularios en este protocolo. Añada al menos un formulario.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button className="w-full sm:w-auto" onClick={nextStep}>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Paso 3: Asignar pacientes */}
      {currentStep === 3 && (
        <>
          <Card className="w-full">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/50 p-3 rounded-md gap-2">
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

          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button className="w-full sm:w-auto" onClick={saveProtocol} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar protocolo
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
