"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { patientFormApi, patientProtocolApi } from "@/lib/patient-api"
import type { Question, FormInstance, QuestionOption } from "@/lib/patient-api"
import { useLanguage } from "@/lib/language-context"

export default function FormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { language } = useLanguage()

  const formId = params.id as string
  const protocolId = searchParams.get("protocol_id")
  const patientProtocolId = searchParams.get("patient_protocol_id")

  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [selectedOptions, setSelectedOptions] = useState<Record<string, QuestionOption | QuestionOption[]>>({})
  const [otherResponses, setOtherResponses] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formInstance, setFormInstance] = useState<FormInstance | null>(null)
  const [protocolFormId, setProtocolFormId] = useState<number | null>(null)
  const [questionTypes, setQuestionTypes] = useState<any[]>([])

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
            if (
              question.question_type_id === 2 || // optionandtext
              question.question_type_id === 6 || // optionmultipleandtext
              question.question_type_id === 4 // optiondropdownandtext
            ) {
              try {
                const options = await patientFormApi.getQuestionOptions(question.id)
                console.log(`Opciones para pregunta ${question.id}:`, options)
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
        setError(language === "es" ? "Error al cargar el formulario" : "Error loading form")
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

  const handleOptionSelect = (questionId: number, option: QuestionOption, value: string) => {
    console.log(`Opción seleccionada para pregunta ${questionId}:`, option)
    console.log(`Key name de la opción:`, option.key_name)

    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: option,
    }))

    // SIEMPRE guardar la respuesta en español
    setResponses((prev) => ({
      ...prev,
      [questionId]: option.text_es, // Siempre usar texto en español
    }))

    // Si no es la opción "otra_" o "other", limpiar el texto adicional
    if (!option.key_name.startsWith("otra_") && option.key_name !== "other") {
      setOtherResponses((prev) => ({
        ...prev,
        [questionId]: "",
      }))
    }
  }

  const handleCheckboxOptionSelect = (questionId: number, option: QuestionOption, checked: boolean) => {
    console.log(`Checkbox ${checked ? "seleccionado" : "deseleccionado"} para pregunta ${questionId}:`, option)
    console.log(`Key name de la opción:`, option.key_name)

    const currentValues = responses[questionId] || []
    const currentOptions = selectedOptions[questionId] || []

    let newValues = [...currentValues]
    let newOptions = Array.isArray(currentOptions) ? [...currentOptions] : []

    if (checked) {
      // Agregar opción - SIEMPRE en español
      newValues.push(option.text_es)
      newOptions.push(option)
    } else {
      // Remover opción - SIEMPRE en español
      newValues = currentValues.filter((v: string) => v !== option.text_es)
      newOptions = Array.isArray(currentOptions)
        ? currentOptions.filter((opt: QuestionOption) => opt.id !== option.id)
        : []

      // Si es la opción "otra_" o "other", limpiar el texto adicional
      if (option.key_name.startsWith("otra_") || option.key_name === "other") {
        setOtherResponses((prev) => ({
          ...prev,
          [questionId]: "",
        }))
      }
    }

    setResponses((prev) => ({
      ...prev,
      [questionId]: newValues,
    }))

    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: newOptions,
    }))
  }

  const handleOtherTextChange = (questionId: number, value: string) => {
    console.log(`Texto 'otra' cambiado para pregunta ${questionId}:`, value)
    setOtherResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const isOtherSelected = (questionId: number) => {
    const selectedOption = selectedOptions[questionId]
    console.log(`Verificando si 'otra' está seleccionada para pregunta ${questionId}:`, selectedOption)

    if (Array.isArray(selectedOption)) {
      const hasOther = selectedOption.some((opt: QuestionOption) => {
        console.log(
          `Verificando opción en array:`,
          opt.key_name,
          opt.key_name.startsWith("otra_") || opt.key_name === "other",
        )
        return opt.key_name.startsWith("otra_") || opt.key_name === "other"
      })
      console.log(`Resultado para array:`, hasOther)
      return hasOther
    }

    if (selectedOption && (selectedOption as QuestionOption).key_name) {
      const hasOther =
        (selectedOption as QuestionOption).key_name.startsWith("otra_") ||
        (selectedOption as QuestionOption).key_name === "other"
      console.log(`Resultado para opción única:`, hasOther)
      return hasOther
    }

    console.log(`No hay opción 'otra' seleccionada`)
    return false
  }

  const getNumbersRange = (question: Question) => {
    // Buscar el tipo de pregunta en questionTypes si está disponible
    const questionType = questionTypes?.find((t) => t.id === question.question_type_id)

    if (questionType && questionType.key_name.startsWith("numbers_")) {
      const parts = questionType.key_name.split("_")
      const min = Number.parseInt(parts[1]) || 1
      const max = Number.parseInt(parts[2]) || 5
      return { min, max }
    }

    // Fallback por si no se encuentra el tipo
    return { min: 1, max: 5 }
  }

  const handleSubmit = async () => {
    if (!patientProtocolId || !protocolFormId) {
      setError(
        language === "es"
          ? "Faltan parámetros necesarios para enviar el formulario"
          : "Missing required parameters to submit form",
      )
      return
    }

    // Validar campos requeridos
    const requiredQuestions = questions.filter((question) => question.is_required)
    const missingQuestions = requiredQuestions.filter((question) => {
      const hasResponse =
        responses[question.id] !== undefined && responses[question.id] !== null && responses[question.id] !== ""

      // Para preguntas de tipo array (checkbox), verificar que tenga al menos un elemento
      if (Array.isArray(responses[question.id])) {
        return responses[question.id].length === 0
      }

      // Para preguntas con opción "otra_" o "other" seleccionada, verificar que tenga texto
      if (isOtherSelected(question.id) && (!otherResponses[question.id] || otherResponses[question.id].trim() === "")) {
        return true
      }

      return !hasResponse
    })

    if (missingQuestions.length > 0) {
      const questionTexts = missingQuestions.map((q) => (language === "es" ? q.text_es : q.text_en))
      setError(
        language === "es"
          ? `Por favor complete las siguientes preguntas requeridas: ${questionTexts.join(", ")}`
          : `Please complete the following required questions: ${questionTexts.join(", ")}`,
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

      // 2. Enviar respuestas individuales - SIEMPRE EN ESPAÑOL
      console.log("2. Enviando respuestas...")
      for (const question of questions) {
        const response = responses[question.id]
        const selectedOption = selectedOptions[question.id]

        if (response !== undefined && response !== null && response !== "") {
          try {
            // Para preguntas de checkbox múltiple (optionmultipleandtext)
            if (question.question_type_id === 6 && Array.isArray(response) && Array.isArray(selectedOption)) {
              for (let i = 0; i < response.length; i++) {
                const optionText = response[i] // Ya está en español
                const option = (selectedOption as QuestionOption[])[i]

                let answerText = optionText
                const answerOptionId = option ? option.id : null

                // Si es la opción "otra_" o "other", usar el texto personalizado
                if (
                  option &&
                  (option.key_name.startsWith("otra_") || option.key_name === "other") &&
                  otherResponses[question.id]
                ) {
                  answerText = otherResponses[question.id]
                }

                const responseData = {
                  form_instance_id: createdInstance.id,
                  question_id: question.id,
                  answer_text: answerText,
                  answer_option_id: answerOptionId,
                }

                console.log(`Enviando respuesta checkbox ${i + 1} para pregunta ${question.id}:`, responseData)
                await patientFormApi.submitResponse(responseData)
              }
            }
            // Para preguntas de radio y dropdown (optionandtext, optiondropdownandtext)
            else if (question.question_type_id === 2 || question.question_type_id === 4) {
              let answerText = typeof response === "string" ? response : JSON.stringify(response) // Ya está en español
              const answerOptionId =
                selectedOption && !Array.isArray(selectedOption) ? (selectedOption as QuestionOption).id : null

              // Si es la opción "otra_" o "other", usar el texto personalizado
              if (
                selectedOption &&
                !Array.isArray(selectedOption) &&
                ((selectedOption as QuestionOption).key_name.startsWith("otra_") ||
                  (selectedOption as QuestionOption).key_name === "other") &&
                otherResponses[question.id]
              ) {
                answerText = otherResponses[question.id]
              }

              const responseData = {
                form_instance_id: createdInstance.id,
                question_id: question.id,
                answer_text: answerText,
                answer_option_id: answerOptionId,
              }

              console.log(`Enviando respuesta para pregunta ${question.id}:`, responseData)
              await patientFormApi.submitResponse(responseData)
            }
            // Para preguntas de texto libre y números
            else {
              const responseData = {
                form_instance_id: createdInstance.id,
                question_id: question.id,
                answer_text: typeof response === "string" ? response : JSON.stringify(response),
                answer_option_id: null,
              }

              console.log(`Enviando respuesta de texto libre para pregunta ${question.id}:`, responseData)
              await patientFormApi.submitResponse(responseData)
            }
          } catch (error) {
            console.error(`Error enviando respuesta para pregunta ${question.id}:`, error)
          }
        }
      }

      console.log("Formulario enviado exitosamente")
      setSuccess(language === "es" ? "¡Formulario enviado correctamente!" : "Form submitted successfully!")

      // Redirigir inmediatamente a /patient/forms
      router.push("/patient/forms")
    } catch (error) {
      console.error("Error enviando formulario:", error)
      setError(language === "es" ? "Error al enviar el formulario" : "Error submitting form")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (question: Question) => {
    switch (question.question_type_id) {
      case 1: // text - Texto simple
        return (
          <Input
            type="text"
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={language === "es" ? "Escriba su respuesta..." : "Write your answer..."}
            className="w-full"
          />
        )

      case 2: // optionandtext - Radio buttons con opción "otra_"
        return (
          <div className="space-y-3">
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => {
                // Buscar la opción por el texto mostrado (según idioma)
                const option = question.options?.find((opt) =>
                  language === "es" ? opt.text_es === value : opt.text_en === value,
                )
                if (option) {
                  handleOptionSelect(question.id, option, value)
                }
              }}
              className="space-y-2"
            >
              {question.options?.map((option) => {
                const optionText = language === "es" ? option.text_es : option.text_en
                return (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={optionText} id={`${question.id}-${option.id}`} />
                    <Label htmlFor={`${question.id}-${option.id}`} className="text-sm leading-relaxed">
                      {optionText}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>

            {/* Campo de texto para "otra_" o "other" en radio */}
            {isOtherSelected(question.id) && (
              <div className="ml-6 mt-3 p-3 border-l-2 border-blue-200 bg-blue-50/50">
                <Label htmlFor={`other-${question.id}`} className="text-sm mb-2 block font-medium">
                  {language === "es" ? "Especifique:" : "Specify:"}
                </Label>
                <Input
                  id={`other-${question.id}`}
                  value={otherResponses[question.id] || ""}
                  onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                  placeholder={language === "es" ? "Escriba su respuesta..." : "Write your answer..."}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )

      case 6: // optionmultipleandtext - Checkboxes múltiples con opción "otra_"
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              {question.options?.map((option) => {
                const optionText = language === "es" ? option.text_es : option.text_en
                return (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${question.id}-${option.id}`}
                      checked={(responses[question.id] || []).includes(option.text_es)} // Verificar contra texto en español
                      onCheckedChange={(checked) => {
                        handleCheckboxOptionSelect(question.id, option, checked as boolean)
                      }}
                    />
                    <Label htmlFor={`${question.id}-${option.id}`} className="text-sm leading-relaxed">
                      {optionText}
                    </Label>
                  </div>
                )
              })}
            </div>

            {/* Campo de texto para "otra_" o "other" en checkbox */}
            {isOtherSelected(question.id) && (
              <div className="ml-6 mt-3 p-3 border-l-2 border-blue-200 bg-blue-50/50">
                <Label htmlFor={`other-checkbox-${question.id}`} className="text-sm mb-2 block font-medium">
                  {language === "es" ? "Especifique:" : "Specify:"}
                </Label>
                <Input
                  id={`other-checkbox-${question.id}`}
                  value={otherResponses[question.id] || ""}
                  onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                  placeholder={language === "es" ? "Escriba su respuesta..." : "Write your answer..."}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )

      case 4: // optiondropdownandtext - Dropdown con opción "otra_"
        return (
          <div className="space-y-3">
            <Select
              value={language === "es" ? responses[question.id] : ""} // Mostrar según idioma pero guardar en español
              onValueChange={(value) => {
                const option = question.options?.find((opt) =>
                  language === "es" ? opt.text_es === value : opt.text_en === value,
                )
                if (option) {
                  handleOptionSelect(question.id, option, value)
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === "es" ? "Seleccione una opción..." : "Select an option..."} />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => {
                  const optionText = language === "es" ? option.text_es : option.text_en
                  return (
                    <SelectItem key={option.id} value={optionText}>
                      {optionText}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Campo de texto para "otra_" o "other" en dropdown */}
            {isOtherSelected(question.id) && (
              <div className="mt-3 p-3 border-l-2 border-blue-200 bg-blue-50/50">
                <Label htmlFor={`other-dropdown-${question.id}`} className="text-sm mb-2 block font-medium">
                  {language === "es" ? "Especifique:" : "Specify:"}
                </Label>
                <Input
                  id={`other-dropdown-${question.id}`}
                  value={otherResponses[question.id] || ""}
                  onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                  placeholder={language === "es" ? "Escriba su respuesta..." : "Write your answer..."}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )

      case 5: // numbers_X_Y - Input numérico con rango dinámico
        const range = getNumbersRange(question)
        return (
          <div className="space-y-2">
            <Input
              type="number"
              min={range.min}
              max={range.max}
              value={responses[question.id] || ""}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value)
                if (value >= range.min && value <= range.max) {
                  handleInputChange(question.id, e.target.value)
                } else if (e.target.value === "") {
                  handleInputChange(question.id, "")
                }
              }}
              placeholder={
                language === "es"
                  ? `Número del ${range.min} al ${range.max}`
                  : `Number from ${range.min} to ${range.max}`
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              {language === "es"
                ? `Ingrese un número entre ${range.min} y ${range.max}`
                : `Enter a number between ${range.min} and ${range.max}`}
            </p>
          </div>
        )

      default:
        return (
          <Input
            type="text"
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={language === "es" ? "Escriba su respuesta..." : "Write your answer..."}
            className="w-full"
          />
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{language === "es" ? "Cargando formulario..." : "Loading form..."}</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {language === "es" ? "Formulario no encontrado" : "Form not found"}
        </h2>
        <p className="text-gray-600 mb-4">
          {language === "es"
            ? "No se encontraron preguntas para este formulario."
            : "No questions found for this form."}
        </p>
        <Link href="/patient/forms">
          <Button>{language === "es" ? "Volver a Formularios" : "Back to Forms"}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/patient/forms">
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "es" ? "Volver" : "Back"}
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {language === "es" ? "Formulario Médico" : "Medical Form"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {language === "es" ? "Complete todas las preguntas requeridas" : "Complete all required questions"}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {language === "es" ? "Preguntas del Formulario" : "Form Questions"}
            </CardTitle>
            <CardDescription className="text-sm">
              {language === "es"
                ? "Por favor responda todas las preguntas marcadas como requeridas (*)"
                : "Please answer all questions marked as required (*)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions
              .sort((a, b) => a.order_in_form - b.order_in_form)
              .map((question, index) => (
                <div key={question.id} className="space-y-3 border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <Label className="text-sm sm:text-base font-medium leading-relaxed block">
                    <span className="text-blue-600 font-semibold mr-2">{index + 1}.</span>
                    {language === "es" ? question.text_es : question.text_en}
                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <div className="w-full">{renderField(question)}</div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end pb-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 min-h-[44px]"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting
              ? language === "es"
                ? "Enviando..."
                : "Submitting..."
              : language === "es"
                ? "Enviar Formulario"
                : "Submit Form"}
          </Button>
        </div>
      </div>
    </div>
  )
}
