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
import { formsApi, questionsApi, questionTypesApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Form {
  id: number
  key_name: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
}

interface Question {
  id: number
  form_id: number
  question_type_id: number
  question_text_es: string
  question_text_en: string
  is_required: boolean
  order_index: number
}

interface QuestionType {
  id: number
  type_name: string
  description: string
}

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId = Number.parseInt(params.id as string)

  const [form, setForm] = useState<Form>({
    id: 0,
    key_name: "",
    name_es: "",
    name_en: "",
    description_es: "",
    description_en: "",
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const canEdit = authUtils.canEdit()
  const isAdmin = authUtils.isAdmin()

  useEffect(() => {
    if (!canEdit) {
      router.push("/admin/forms")
      return
    }
    loadFormData()
  }, [formId, canEdit])

  const loadFormData = async () => {
    try {
      setLoading(true)
      setError("")

      // Cargar datos del formulario
      const formData = await formsApi.getForm(formId)
      setForm(formData)

      // Cargar preguntas del formulario
      const questionsData = await questionsApi.getQuestionsByForm(formId)
      setQuestions(questionsData || [])

      // Cargar tipos de pregunta
      const typesData = await questionTypesApi.getQuestionTypes()
      setQuestionTypes(typesData || [])
    } catch (err) {
      console.error("Error loading form data:", err)
      setError(`Error al cargar el formulario: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: 0, // Nuevo
      form_id: formId,
      question_type_id: 1,
      question_text_es: "",
      question_text_en: "",
      is_required: false,
      order_index: questions.length + 1,
    }
    setQuestions((prev) => [...prev, newQuestion])
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const saveForm = async () => {
    if (!canEdit) {
      setError("No tienes permisos para realizar esta acción")
      return
    }

    // Validaciones
    if (!form.key_name || !form.name_es || !form.name_en) {
      setError("Por favor complete todos los campos obligatorios del formulario")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      // Actualizar formulario
      await formsApi.updateForm(formId, form)

      // Aquí podrías implementar la actualización de preguntas
      // Por ahora solo actualizamos el formulario base

      setSuccess("Formulario actualizado exitosamente")
    } catch (err) {
      console.error("Error saving form:", err)
      setError(`Error al guardar el formulario: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/admin/forms">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Formulario</h1>
            <p className="text-muted-foreground">Modifique la información del formulario</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={saveForm} disabled={saving}>
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

      {/* Información del formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Formulario</CardTitle>
          <CardDescription>Datos básicos del formulario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key_name">
                Clave del Formulario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="key_name"
                value={form.key_name}
                onChange={(e) => handleFormChange("key_name", e.target.value)}
                placeholder="ej: form_satisfaction"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_es">
                Nombre (Español) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name_es"
                value={form.name_es}
                onChange={(e) => handleFormChange("name_es", e.target.value)}
                placeholder="Nombre del formulario en español"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">
                Nombre (Inglés) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name_en"
                value={form.name_en}
                onChange={(e) => handleFormChange("name_en", e.target.value)}
                placeholder="Form name in English"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_es">Descripción (Español)</Label>
              <Textarea
                id="description_es"
                value={form.description_es}
                onChange={(e) => handleFormChange("description_es", e.target.value)}
                placeholder="Descripción del formulario en español"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_en">Descripción (Inglés)</Label>
              <Textarea
                id="description_en"
                value={form.description_en}
                onChange={(e) => handleFormChange("description_en", e.target.value)}
                placeholder="Form description in English"
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preguntas del formulario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preguntas del Formulario</CardTitle>
              <CardDescription>Gestiona las preguntas de este formulario</CardDescription>
            </div>
            {canEdit && (
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Pregunta
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay preguntas en este formulario</p>
              {canEdit && (
                <Button onClick={addQuestion} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Pregunta
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Pregunta {index + 1}</CardTitle>
                      {canEdit && (
                        <Button variant="destructive" size="sm" onClick={() => removeQuestion(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pregunta (Español)</Label>
                        <Textarea
                          value={question.question_text_es}
                          onChange={(e) => handleQuestionChange(index, "question_text_es", e.target.value)}
                          placeholder="Texto de la pregunta en español"
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pregunta (Inglés)</Label>
                        <Textarea
                          value={question.question_text_en}
                          onChange={(e) => handleQuestionChange(index, "question_text_en", e.target.value)}
                          placeholder="Question text in English"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Pregunta</Label>
                        <Select
                          value={question.question_type_id.toString()}
                          onValueChange={(value) =>
                            handleQuestionChange(index, "question_type_id", Number.parseInt(value))
                          }
                          disabled={!canEdit}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.type_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={question.is_required}
                              onChange={(e) => handleQuestionChange(index, "is_required", e.target.checked)}
                              disabled={!canEdit}
                            />
                            <span>Obligatoria</span>
                          </label>
                          <Badge variant={question.is_required ? "default" : "secondary"}>
                            {question.is_required ? "Requerida" : "Opcional"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link href="/admin/forms">
          <Button variant="outline">Cancelar</Button>
        </Link>
        {canEdit && (
          <Button onClick={saveForm} disabled={saving}>
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
