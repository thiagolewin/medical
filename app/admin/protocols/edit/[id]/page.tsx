"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { protocolsApi, formsApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

interface Protocol {
  id: number
  name_es: string
  name_en: string
  description_es: string
  description_en: string
}

interface Form {
  id: number
  key_name: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
}

interface ProtocolForm {
  id: number
  protocol_id: number
  form_id: number
  order_index: number
  is_required: boolean
  form: Form
}

export default function EditProtocolPage() {
  const router = useRouter()
  const params = useParams()
  const protocolId = Number.parseInt(params.id as string)

  const [protocol, setProtocol] = useState<Protocol>({
    id: 0,
    name_es: "",
    name_en: "",
    description_es: "",
    description_en: "",
  })

  const [protocolForms, setProtocolForms] = useState<ProtocolForm[]>([])
  const [availableForms, setAvailableForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const canEdit = authUtils.canEdit()
  const isAdmin = authUtils.isAdmin()

  useEffect(() => {
    if (!canEdit) {
      router.push("/admin/protocols")
      return
    }
    loadProtocolData()
  }, [protocolId, canEdit])

  const loadProtocolData = async () => {
    try {
      setLoading(true)
      setError("")

      // Cargar datos del protocolo
      const protocolData = await protocolsApi.getProtocol(protocolId)
      setProtocol(protocolData)

      // Cargar formularios del protocolo
      const formsData = await protocolsApi.getProtocolForms(protocolId)
      setProtocolForms(formsData || [])

      // Cargar todos los formularios disponibles
      const allForms = await formsApi.getForms()
      setAvailableForms(allForms || [])
    } catch (err) {
      console.error("Error loading protocol data:", err)
      setError(`Error al cargar el protocolo: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleProtocolChange = (field: string, value: string) => {
    setProtocol((prev) => ({ ...prev, [field]: value }))
  }

  const handleFormChange = (index: number, field: string, value: any) => {
    setProtocolForms((prev) => prev.map((pf, i) => (i === index ? { ...pf, [field]: value } : pf)))
  }

  const addForm = () => {
    if (availableForms.length === 0) return

    const newProtocolForm: ProtocolForm = {
      id: 0, // Nuevo
      protocol_id: protocolId,
      form_id: availableForms[0].id,
      order_index: protocolForms.length + 1,
      is_required: false,
      form: availableForms[0],
    }
    setProtocolForms((prev) => [...prev, newProtocolForm])
  }

  const removeForm = (index: number) => {
    setProtocolForms((prev) => prev.filter((_, i) => i !== index))
  }

  const saveProtocol = async () => {
    if (!canEdit) {
      setError("No tienes permisos para realizar esta acción")
      return
    }

    // Validaciones
    if (!protocol.name_es || !protocol.name_en) {
      setError("Por favor complete todos los campos obligatorios del protocolo")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      // Actualizar protocolo
      await protocolsApi.updateProtocol(protocolId, protocol)

      // Actualizar formularios del protocolo
      const formsToUpdate = protocolForms.map((pf, index) => ({
        form_id: pf.form_id,
        order_index: index + 1,
        is_required: pf.is_required,
      }))

      await protocolsApi.updateProtocolForms(protocolId, { forms: formsToUpdate })

      setSuccess("Protocolo actualizado exitosamente")
    } catch (err) {
      console.error("Error saving protocol:", err)
      setError(`Error al guardar el protocolo: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
            <h1 className="text-3xl font-bold tracking-tight">Editar Protocolo</h1>
            <p className="text-muted-foreground">Modifique la información del protocolo</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={saveProtocol} disabled={saving}>
            {saving ? (
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
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Información del protocolo */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Protocolo</CardTitle>
          <CardDescription>Datos básicos del protocolo médico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_es">
                Nombre (Español) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name_es"
                value={protocol.name_es}
                onChange={(e) => handleProtocolChange("name_es", e.target.value)}
                placeholder="Nombre del protocolo en español"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">
                Nombre (Inglés) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name_en"
                value={protocol.name_en}
                onChange={(e) => handleProtocolChange("name_en", e.target.value)}
                placeholder="Protocol name in English"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_es">Descripción (Español)</Label>
              <Textarea
                id="description_es"
                value={protocol.description_es}
                onChange={(e) => handleProtocolChange("description_es", e.target.value)}
                placeholder="Descripción del protocolo en español"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_en">Descripción (Inglés)</Label>
              <Textarea
                id="description_en"
                value={protocol.description_en}
                onChange={(e) => handleProtocolChange("description_en", e.target.value)}
                placeholder="Protocol description in English"
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formularios del protocolo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Formularios del Protocolo</CardTitle>
              <CardDescription>Gestiona los formularios asociados a este protocolo</CardDescription>
            </div>
            {canEdit && (
              <Button onClick={addForm} disabled={availableForms.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Formulario
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {protocolForms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay formularios en este protocolo</p>
              {canEdit && availableForms.length > 0 && (
                <Button onClick={addForm} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Formulario
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {protocolForms.map((protocolForm, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Formulario {index + 1}: {protocolForm.form?.name_es || "Sin nombre"}
                      </CardTitle>
                      {canEdit && (
                        <Button variant="destructive" size="sm" onClick={() => removeForm(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Formulario</Label>
                        <Select
                          value={protocolForm.form_id.toString()}
                          onValueChange={(value) => {
                            const selectedForm = availableForms.find((f) => f.id === Number.parseInt(value))
                            handleFormChange(index, "form_id", Number.parseInt(value))
                            handleFormChange(index, "form", selectedForm)
                          }}
                          disabled={!canEdit}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione formulario" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableForms.map((form) => (
                              <SelectItem key={form.id} value={form.id.toString()}>
                                {form.name_es}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Configuración</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${index}`}
                              checked={protocolForm.is_required}
                              onCheckedChange={(checked) => handleFormChange(index, "is_required", checked)}
                              disabled={!canEdit}
                            />
                            <Label htmlFor={`required-${index}`}>Obligatorio</Label>
                          </div>
                          <Badge variant={protocolForm.is_required ? "default" : "secondary"}>
                            {protocolForm.is_required ? "Requerido" : "Opcional"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {protocolForm.form && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Descripción:</strong> {protocolForm.form.description_es || "Sin descripción"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Clave:</strong> {protocolForm.form.key_name}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/protocols">
          <Button variant="outline">Cancelar</Button>
        </Link>
        {canEdit && (
          <Button onClick={saveProtocol} disabled={saving}>
            {saving ? (
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
        )}
      </div>
    </div>
  )
}
