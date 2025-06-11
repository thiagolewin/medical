"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { patientFormApi, patientProtocolApi } from "@/lib/patient-api"
import type { Question, FormInstance } from "@/lib/patient-api"

export default function FormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const formId = params.id as string
  const protocolId = searchParams.get("protocol_id")
  const patientProtocolId = searchParams.get("patient_protocol_id")

  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formInstance, setFormInstance] = useState<FormInstance | null>(null)
  const [protocolFormId, setProtocolFormId] = useState<number | null>(null)

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoading(true)
        setError("")

        console.log("=== CARGANDO DATOS DEL FORMULARIO ===")
        console.log("Form ID:", formId)
        console.log("Protocol ID:", protocolId)
        console.log("Patient Protocol ID:", patientProtocolId)

        if (!protocolId) {
          throw new Error("Protocol ID es requerido")
        }

        // 1. Obtener los formularios del protocolo para encontrar el protocol_form_id
        console.log("1. Obteniendo formularios del protocolo...")
        const protocolForms = await patientProtocolApi.getProtocolForms(Number.parseInt(protocolId))
        console.log("Protocol forms:", protocolForms)

        // Encontrar el protocol_form_id que corresponde a este form_id
        const matchingProtocolForm = protocolForms.find((pf) => pf.form_id === Number.parseInt(formId))
        if (!matchingProtocolForm) {
          throw new Error("No se encontró el formulario en este protocolo")
        }

        console.log("Matching protocol form:", matchingProtocolForm)
        setProtocolFormId(matchingProtocolForm.id)

        // 2. Cargar preguntas del formulario
        console.log("2. Cargando preguntas del formulario...")
        const formQuestions = await patientFormApi.getFormQuestions(Number.parseInt(formId))
        console.log("Preguntas cargadas:", formQuestions)

        // 3. Cargar opciones para preguntas que las tengan
        console.log("3. Cargando opciones de preguntas...")
        const questionsWithOptions = await Promise.all(
          formQuestions.map(async (question) => {
            if (question.question_type_id === 2 || question.question_type_id === 3) {
              // Radio o Checkbox
              try {
                const options = await patientFormApi.getQuestionOptions(question.id)
                return { ...question, options }
              } catch (error) {
                console.error(`Error cargando opciones para pregunta ${question.id}:`, error)
                return question
              }
            }
            return question
          }),
        )

        console.log("Preguntas con opciones:", questionsWithOptions)
        setQuestions(questionsWithOptions)
      } catch (error) {
        console.error("Error cargando datos del formulario:", error)
        setError("Error al cargar el formulario")
      } finally {
        setIsLoading(false)
      }
    }

    if (formId && protocolId) {
      loadFormData()
    }
  }, [formId, protocolId])

  const handleInputChange = (questionId: number, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!patientProtocolId || !protocolFormId) {
      setError("Faltan parámetros necesarios para enviar el formulario")
      return
    }

    // Validar campos requeridos
    const requiredQuestions = questions.filter((question) => question.is_required)
    const missingQuestions = requiredQuestions.filter((question) => !responses[question.id])

    if (missingQuestions.length > 0) {
      setError(
        `Por favor complete las siguientes preguntas requeridas: ${missingQuestions.map((q) => q.text_es).join(", ")}`,
      )
      return
    }

    setIsSubmitting(true)
    try {
      console.log("=== ENVIANDO FORMULARIO ===")

      // 1. Crear instancia del formulario
      console.log("1. Creando instancia del formulario...")
      const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

      const instanceData = {
        patient_protocol_id: patientProtocolId,
        protocol_form_id: protocolFormId.toString(),
        scheduled_date: today,
      }

      console.log("Datos para crear instancia:", instanceData)
      const createdInstance = await patientFormApi.createFormInstance(instanceData)
      console.log("Instancia creada:", createdInstance)
      setFormInstance(createdInstance)

      // 2. Enviar respuestas individuales
      console.log("2. Enviando respuestas...")
      for (const question of questions) {
        const response = responses[question.id]
        if (response !== undefined && response !== null && response !== "") {
          try {
            const responseData = {
              form_instance_id: createdInstance.id,
              question_id: question.id,
              answer_text: typeof response === "string" ? response : JSON.stringify(response),
              answer_option_id: null,
            }

            console.log(`Enviando respuesta para pregunta ${question.id}:`, responseData)
            await patientFormApi.submitResponse(responseData)
          } catch (error) {
            console.error(`Error enviando respuesta para pregunta ${question.id}:`, error)
          }
        }
      }

      console.log("Formulario enviado exitosamente")
      setSuccess("¡Formulario enviado correctamente!")

      // Redirigir a /patient/forms después de 2 segundos
      setTimeout(() => {
        router.push("/patient/forms")
      }, 2000)
    } catch (error) {
      console.error("Error enviando formulario:", error)
      setError("Error al enviar el formulario")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (question: Question) => {
    switch (question.question_type_id) {
      case 1: // Texto
        return (
          <Input
            type="text"
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Escriba su respuesta..."
          />
        )

      case 2: // Radio (Opción única)
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) => handleInputChange(question.id, value)}
          >
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.text_es} id={`${question.id}-${option.id}`} />
                <Label htmlFor={`${question.id}-${option.id}`}>{option.text_es}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 3: // Checkbox (Opción múltiple)
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option.id}`}
                  checked={(responses[question.id] || []).includes(option.text_es)}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || []
                    if (checked) {
                      handleInputChange(question.id, [...currentValues, option.text_es])
                    } else {
                      handleInputChange(
                        question.id,
                        currentValues.filter((v: string) => v !== option.text_es),
                      )
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${option.id}`}>{option.text_es}</Label>
              </div>
            ))}
          </div>
        )

      case 4: // Textarea
        return (
          <Textarea
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Escriba su respuesta detallada..."
            rows={4}
          />
        )

      case 5: // Número
        return (
          <Input
            type="number"
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Ingrese un número..."
          />
        )

      default:
        return (
          <Input
            type="text"
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Escriba su respuesta..."
          />
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Formulario no encontrado</h2>
        <p className="text-gray-600 mb-4">No se encontraron preguntas para este formulario.</p>
        <Link href="/patient/forms">
          <Button>Volver a Formularios</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/patient/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Formulario Médico</h1>
            <p className="text-gray-600">Complete todas las preguntas requeridas</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas del Formulario</CardTitle>
          <CardDescription>Por favor responda todas las preguntas marcadas como requeridas (*)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions
            .sort((a, b) => a.order_in_form - b.order_in_form)
            .map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="text-base font-medium">
                  {question.text_es}
                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="text-sm text-gray-500 mb-2">Tipo: {question.question_type_es}</div>
                {renderField(question)}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Enviando..." : "Enviar Formulario"}
        </Button>
      </div>
    </div>
  )
}
