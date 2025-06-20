"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { protocolsApi, questionsApi, questionTypesApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { ChevronRight, ChevronLeft, Search, Plus, Trash2, FileSpreadsheet, Loader2 } from "lucide-react"
import { config } from "@/lib/config"

// Tipos actualizados según la API real
interface Protocol {
  id: number
  key_name: string
  name_es: string
  name_en: string
  created_at: string
  updated_at: string
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

interface Question {
  id: number
  form_id: number
  key_name: string
  text_es: string
  text_en: string
  question_type_id: number
  question_type_key?: string
  is_required: boolean
  order_in_form: number
  created_at: string
  updated_at: string
  question_type_es: string
  question_type_en: string
  options?: QuestionOption[]
}

interface QuestionOption {
  id: number
  question_id: number
  key_name: string
  text_es: string
  text_en: string
  order_in_option: number
}

interface QuestionType {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

interface FilterCondition {
  id: string
  protocol_id: number
  form_id: number
  question_id: number
  question_text: string
  question_type_id: number
  question_type_key?: string
  selected_answers: string[]
  text_answer?: string
  operator: string
}

interface ResultField {
  id: string
  protocol_id: number
  form_id: number
  question_id: number
  question_text: string
}

interface FilterPayload {
  filtros: {
    idForm: number
    idProtocolo: number
    idPregunta: number
    anwerText: string
  }[]
  traer: number[]
}

export default function AnalysisPage() {
  const { language } = useLanguage()
  const isSpanish = language === "es"

  // Estados principales
  const [currentStep, setCurrentStep] = useState(1)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolForms, setProtocolForms] = useState<{ [protocolId: number]: ProtocolForm[] }>({})
  const [questions, setQuestions] = useState<{ [formId: number]: Question[] }>({})
  const [questionOptions, setQuestionOptions] = useState<{ [questionId: number]: QuestionOption[] }>({})
  const [questionTypes, setQuestionTypes] = useState<{ [typeId: number]: QuestionType }>({})

  // Estados para el paso 1 (filtros)
  const [selectedProtocols, setSelectedProtocols] = useState<number[]>([])
  const [selectedForms, setSelectedForms] = useState<number[]>([])
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])

  // Estados para el paso 2 (campos de resultado)
  const [resultFields, setResultFields] = useState<ResultField[]>([])

  // Estados para resultados
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState({
    protocols: false,
    forms: false,
    questions: false,
    options: false,
    questionTypes: false,
    query: false,
  })

  // Cargar tipos de preguntas al inicio
  useEffect(() => {
    const fetchQuestionTypes = async () => {
      setLoadingStates((prev) => ({ ...prev, questionTypes: true }))
      try {
        const typesData = await questionTypesApi.getQuestionTypes()
        console.log("Tipos de preguntas cargados:", typesData)

        // Convertir array a objeto indexado por ID
        const typesMap: { [typeId: number]: QuestionType } = {}
        if (typesData && Array.isArray(typesData)) {
          typesData.forEach((type: QuestionType) => {
            typesMap[type.id] = type
          })
        }
        setQuestionTypes(typesMap)
      } catch (error) {
        console.error("Error cargando tipos de preguntas:", error)
      } finally {
        setLoadingStates((prev) => ({ ...prev, questionTypes: false }))
      }
    }

    fetchQuestionTypes()
  }, [])

  // Cargar protocolos iniciales
  useEffect(() => {
    const fetchProtocols = async () => {
      setLoadingStates((prev) => ({ ...prev, protocols: true }))
      try {
        const protocolsData = await protocolsApi.getProtocols()
        console.log("Protocolos cargados:", protocolsData)
        setProtocols(protocolsData || [])
      } catch (error) {
        console.error("Error cargando protocolos:", error)
      } finally {
        setLoadingStates((prev) => ({ ...prev, protocols: false }))
      }
    }

    fetchProtocols()
  }, [])

  // Cargar formularios cuando se seleccionan protocolos
  useEffect(() => {
    const fetchProtocolForms = async () => {
      if (selectedProtocols.length === 0) return

      setLoadingStates((prev) => ({ ...prev, forms: true }))
      try {
        const formsData: { [protocolId: number]: ProtocolForm[] } = {}

        for (const protocolId of selectedProtocols) {
          try {
            const forms = await protocolsApi.getProtocolForms(protocolId)
            console.log(`Formularios del protocolo ${protocolId}:`, forms)
            formsData[protocolId] = forms || []
          } catch (error) {
            console.error(`Error cargando formularios del protocolo ${protocolId}:`, error)
            formsData[protocolId] = []
          }
        }

        setProtocolForms(formsData)
      } catch (error) {
        console.error("Error cargando formularios:", error)
      } finally {
        setLoadingStates((prev) => ({ ...prev, forms: false }))
      }
    }

    fetchProtocolForms()
  }, [selectedProtocols])

  // Cargar preguntas cuando se seleccionan formularios
  useEffect(() => {
    const fetchQuestions = async () => {
      if (selectedForms.length === 0) return

      setLoadingStates((prev) => ({ ...prev, questions: true }))
      try {
        const questionsData: { [formId: number]: Question[] } = {}

        for (const formId of selectedForms) {
          try {
            const formQuestions = await questionsApi.getQuestionsByForm(formId)
            console.log(`Preguntas del formulario ${formId}:`, formQuestions)
            questionsData[formId] = formQuestions || []
          } catch (error) {
            console.error(`Error cargando preguntas del formulario ${formId}:`, error)
            questionsData[formId] = []
          }
        }

        setQuestions(questionsData)
      } catch (error) {
        console.error("Error cargando preguntas:", error)
      } finally {
        setLoadingStates((prev) => ({ ...prev, questions: false }))
      }
    }

    fetchQuestions()
  }, [selectedForms])

  // Obtener formularios filtrados por protocolos seleccionados
  const getFilteredForms = (): ProtocolForm[] => {
    const allForms: ProtocolForm[] = []
    selectedProtocols.forEach((protocolId) => {
      const forms = protocolForms[protocolId] || []
      allForms.push(...forms)
    })
    return allForms
  }

  // Obtener preguntas filtradas por formularios seleccionados
  const getFilteredQuestions = (): Question[] => {
    const allQuestions: Question[] = []
    selectedForms.forEach((formId) => {
      const formQuestions = questions[formId] || []
      allQuestions.push(...formQuestions)
    })
    return allQuestions
  }

  // Cargar opciones de una pregunta
  const loadQuestionOptions = async (questionId: number) => {
    if (questionOptions[questionId]) return // Ya cargadas

    setLoadingStates((prev) => ({ ...prev, options: true }))
    try {
      const options = await questionsApi.getQuestionOptions(questionId)
      console.log(`Opciones de la pregunta ${questionId}:`, options)
      setQuestionOptions((prev) => ({
        ...prev,
        [questionId]: options || [],
      }))
    } catch (error) {
      console.error(`Error cargando opciones de la pregunta ${questionId}:`, error)
      setQuestionOptions((prev) => ({
        ...prev,
        [questionId]: [],
      }))
    } finally {
      setLoadingStates((prev) => ({ ...prev, options: false }))
    }
  }

  // Obtener el tipo de pregunta por ID
  const getQuestionType = (question: Question): QuestionType | null => {
    return questionTypes[question.question_type_id] || null
  }

  // Verificar si una pregunta es de tipo texto o numérica
  const isTextOrNumberQuestion = (question: Question): boolean => {
    if (!question) return false

    const questionType = getQuestionType(question)
    if (!questionType) return false

    return questionType.key_name === "text" || questionType.key_name.startsWith("numbers_")
  }

  // Obtener información de rango para preguntas numéricas
  const getNumberRange = (question: Question): { min: number; max: number } | null => {
    const questionType = getQuestionType(question)
    if (!questionType || !questionType.key_name.startsWith("numbers_")) {
      return null
    }

    const parts = questionType.key_name.split("_")
    if (parts.length >= 3) {
      const min = Number.parseInt(parts[1])
      const max = Number.parseInt(parts[2])
      return { min, max }
    }

    return null
  }

  // Validar input numérico
  const handleNumberInput = (value: string, range: { min: number; max: number }): string => {
    // Permitir solo números
    const numericValue = value.replace(/[^0-9]/g, "")

    if (numericValue === "") return ""

    const num = Number.parseInt(numericValue)

    // Validar rango
    if (num < range.min) return range.min.toString()
    if (num > range.max) return range.max.toString()

    return num.toString()
  }

  // Agregar condición de filtro
  const addFilterCondition = async (questionId: number) => {
    const question = getFilteredQuestions().find((q) => q.id === questionId)
    if (!question) return

    // Determinar si es una pregunta de texto o numérica
    const isTextOrNumber = isTextOrNumberQuestion(question)

    // Cargar opciones si la pregunta no es de texto ni numérica
    if (!isTextOrNumber) {
      await loadQuestionOptions(questionId)
    }

    const protocolForm = getFilteredForms().find((f) => f.form_id === question.form_id)
    const questionType = getQuestionType(question)

    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      protocol_id: protocolForm?.protocol_id || 0,
      form_id: question.form_id,
      question_id: questionId,
      question_text: isSpanish ? question.text_es : question.text_en,
      question_type_id: question.question_type_id,
      question_type_key: questionType?.key_name,
      selected_answers: [],
      text_answer: "",
      operator: "=",
    }

    setFilterConditions([...filterConditions, newCondition])
  }

  // Eliminar condición de filtro
  const removeFilterCondition = (id: string) => {
    setFilterConditions(filterConditions.filter((condition) => condition.id !== id))
  }

  // Actualizar respuestas seleccionadas en una condición
  const updateConditionAnswers = (conditionId: string, answers: string[]) => {
    setFilterConditions(
      filterConditions.map((condition) =>
        condition.id === conditionId ? { ...condition, selected_answers: answers } : condition,
      ),
    )
  }

  // Actualizar respuesta de texto en una condición
  const updateConditionTextAnswer = (conditionId: string, text: string) => {
    setFilterConditions(
      filterConditions.map((condition) =>
        condition.id === conditionId ? { ...condition, text_answer: text } : condition,
      ),
    )
  }

  // Agregar campo de resultado
  const addResultField = (questionId: number) => {
    const question = getFilteredQuestions().find((q) => q.id === questionId)
    if (!question) return

    const protocolForm = getFilteredForms().find((f) => f.form_id === question.form_id)

    const newField: ResultField = {
      id: Date.now().toString(),
      protocol_id: protocolForm?.protocol_id || 0,
      form_id: question.form_id,
      question_id: questionId,
      question_text: isSpanish ? question.text_es : question.text_en,
    }

    setResultFields([...resultFields, newField])
  }

  // Eliminar campo de resultado
  const removeResultField = (id: string) => {
    setResultFields(resultFields.filter((field) => field.id !== id))
  }

  // Preparar payload para enviar filtros
  const prepareFilterPayload = (): FilterPayload => {
    const filtros: FilterPayload["filtros"] = []

    filterConditions.forEach((condition) => {
      // Si es pregunta de texto o numérica, crear un solo filtro
      if (
        condition.question_type_key === "text" ||
        (condition.question_type_key && condition.question_type_key.startsWith("numbers_"))
      ) {
        filtros.push({
          idForm: condition.form_id,
          idProtocolo: condition.protocol_id,
          idPregunta: condition.question_id,
          anwerText: condition.text_answer || "",
        })
      } else {
        // Para preguntas con opciones, crear un filtro por cada respuesta seleccionada
        condition.selected_answers.forEach((answer) => {
          filtros.push({
            idForm: condition.form_id,
            idProtocolo: condition.protocol_id,
            idPregunta: condition.question_id,
            anwerText: answer,
          })
        })
      }
    })

    // Obtener los IDs de las preguntas seleccionadas como campos de resultado
    const traer = resultFields.map((field) => field.question_id)

    return { filtros, traer }
  }

  // Ejecutar consulta
  const executeQuery = async () => {
    setLoadingStates((prev) => ({ ...prev, query: true }))

    try {
      // Preparar payload con los filtros
      const payload = prepareFilterPayload()
      console.log("Enviando filtros:", payload)

      // Enviar filtros al endpoint correcto con POST
      const API_BASE_URL = config.API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/responses/analizeData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Procesar resultados
      const data = await response.json()
      console.log("Resultados recibidos:", data)

      // Usar los datos reales del backend
      setQueryResults(data || [])
      setCurrentStep(3)
    } catch (error) {
      console.error("Error ejecutando consulta:", error)
      alert(isSpanish ? "Error al ejecutar la consulta" : "Error executing query")
    } finally {
      setLoadingStates((prev) => ({ ...prev, query: false }))
    }
  }

  // Exportar a CSV
  const exportToCSV = () => {
    if (queryResults.length === 0) return

    const headers = Object.keys(queryResults[0])

    // Función para escapar valores con comas
    const escapeCSV = (value: any): string => {
      const stringValue = String(value || "")
      // Si contiene comas, comillas o saltos de línea, encerrarlo en comillas y escapar comillas internas
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    // Crear filas con valores escapados correctamente
    const rows = queryResults.map((result) => headers.map((header) => escapeCSV(result[header])).join(","))

    // Unir encabezados y filas con saltos de línea adecuados
    const csv = [headers.join(","), ...rows].join("\r\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "analysis_results.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url) // Liberar memoria
  }

  // Renderizar opciones de respuesta para una pregunta
  const renderAnswerOptions = (question: Question, condition: FilterCondition) => {
    const questionType = getQuestionType(question)

    // Verificar si es una pregunta de texto o numérica
    if (questionType && (questionType.key_name === "text" || questionType.key_name.startsWith("numbers_"))) {
      const isNumeric = questionType.key_name.startsWith("numbers_")
      const range = isNumeric ? getNumberRange(question) : null

      return (
        <div className="space-y-2">
          <Input
            type={isNumeric ? "number" : "text"}
            value={condition.text_answer || ""}
            onChange={(e) => {
              let value = e.target.value

              // Para inputs numéricos, validar el rango
              if (isNumeric && range) {
                value = handleNumberInput(value, range)
              }

              updateConditionTextAnswer(condition.id, value)
            }}
            onKeyDown={(e) => {
              // Para inputs numéricos, bloquear caracteres no numéricos
              if (isNumeric) {
                const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight"]
                if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                  e.preventDefault()
                }
              }
            }}
            placeholder={
              isNumeric && range
                ? `${isSpanish ? "Ingrese un número" : "Enter a number"} (${range.min}-${range.max})`
                : isSpanish
                  ? "Escriba su respuesta"
                  : "Type your answer"
            }
            min={range?.min}
            max={range?.max}
            className="mt-2"
          />
          {isNumeric && range && (
            <div className="text-xs text-gray-500">
              {isSpanish ? `Rango válido: ${range.min} - ${range.max}` : `Valid range: ${range.min} - ${range.max}`}
            </div>
          )}
        </div>
      )
    }

    const options = questionOptions[question.id] || []

    if (options.length === 0) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">{isSpanish ? "Cargando opciones..." : "Loading options..."}</span>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${condition.id}-${option.id}`}
              checked={condition.selected_answers.includes(isSpanish ? option.text_es : option.text_en)}
              onCheckedChange={(checked) => {
                const optionText = isSpanish ? option.text_es : option.text_en
                const currentAnswers = condition.selected_answers
                const newAnswers = checked
                  ? [...currentAnswers, optionText]
                  : currentAnswers.filter((answer) => answer !== optionText)
                updateConditionAnswers(condition.id, newAnswers)
              }}
            />
            <label htmlFor={`${condition.id}-${option.id}`} className="text-sm">
              {isSpanish ? option.text_es : option.text_en}
            </label>
          </div>
        ))}
      </div>
    )
  }

  // Verificar si una condición está completa
  const isConditionComplete = (condition: FilterCondition): boolean => {
    const questionType = questionTypes[condition.question_type_id]
    if (!questionType) return false

    // Para preguntas de texto o numéricas
    if (questionType.key_name === "text" || questionType.key_name.startsWith("numbers_")) {
      const hasTextAnswer = !!condition.text_answer && condition.text_answer.trim() !== ""

      // Si es numérica, validar también el rango
      if (questionType.key_name.startsWith("numbers_")) {
        if (!hasTextAnswer) return false

        const parts = questionType.key_name.split("_")
        if (parts.length >= 3) {
          const min = Number.parseInt(parts[1])
          const max = Number.parseInt(parts[2])
          const value = Number.parseInt(condition.text_answer)

          return !isNaN(value) && value >= min && value <= max
        }
      }

      return hasTextAnswer
    }

    // Para preguntas con opciones
    return condition.selected_answers.length > 0
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isSpanish ? "Análisis de Datos" : "Data Analysis"}</h1>
        <div className="flex items-center space-x-2">
          <Badge variant={currentStep === 1 ? "default" : "secondary"}>{isSpanish ? "1. Filtros" : "1. Filters"}</Badge>
          <ChevronRight className="h-4 w-4" />
          <Badge variant={currentStep === 2 ? "default" : "secondary"}>{isSpanish ? "2. Campos" : "2. Fields"}</Badge>
          <ChevronRight className="h-4 w-4" />
          <Badge variant={currentStep === 3 ? "default" : "secondary"}>
            {isSpanish ? "3. Resultados" : "3. Results"}
          </Badge>
        </div>
      </div>

      {/* Paso 1: Selección de filtros */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Selección de protocolos */}
          <Card>
            <CardHeader>
              <CardTitle>{isSpanish ? "Seleccionar Protocolos" : "Select Protocols"}</CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Seleccione los protocolos que desea incluir en el análisis"
                  : "Select the protocols you want to include in the analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.protocols ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>{isSpanish ? "Cargando protocolos..." : "Loading protocols..."}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {protocols.map((protocol) => (
                    <div key={protocol.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`protocol-${protocol.id}`}
                        checked={selectedProtocols.includes(protocol.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProtocols([...selectedProtocols, protocol.id])
                          } else {
                            setSelectedProtocols(selectedProtocols.filter((id) => id !== protocol.id))
                            // Limpiar formularios y condiciones relacionadas
                            const protocolFormIds = (protocolForms[protocol.id] || []).map((f) => f.form_id)
                            setSelectedForms(selectedForms.filter((id) => !protocolFormIds.includes(id)))
                            setFilterConditions(filterConditions.filter((c) => !protocolFormIds.includes(c.form_id)))
                          }
                        }}
                      />
                      <label htmlFor={`protocol-${protocol.id}`} className="text-sm font-medium">
                        {isSpanish ? protocol.name_es : protocol.name_en}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selección de formularios */}
          {selectedProtocols.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{isSpanish ? "Seleccionar Formularios" : "Select Forms"}</CardTitle>
                <CardDescription>
                  {isSpanish
                    ? "Seleccione los formularios de los protocolos elegidos"
                    : "Select the forms from the chosen protocols"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.forms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>{isSpanish ? "Cargando formularios..." : "Loading forms..."}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredForms().map((form) => (
                      <div key={form.form_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`form-${form.form_id}`}
                          checked={selectedForms.includes(form.form_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedForms([...selectedForms, form.form_id])
                            } else {
                              setSelectedForms(selectedForms.filter((id) => id !== form.form_id))
                              // Limpiar condiciones relacionadas
                              setFilterConditions(filterConditions.filter((c) => c.form_id !== form.form_id))
                            }
                          }}
                        />
                        <label htmlFor={`form-${form.form_id}`} className="text-sm font-medium">
                          {isSpanish ? form.form_name_es : form.form_name_en}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selección de preguntas y respuestas */}
          {selectedForms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{isSpanish ? "Agregar Condiciones de Filtro" : "Add Filter Conditions"}</CardTitle>
                <CardDescription>
                  {isSpanish
                    ? "Seleccione preguntas y las respuestas que deben tener los pacientes"
                    : "Select questions and the answers that patients should have"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de preguntas disponibles */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{isSpanish ? "Preguntas Disponibles" : "Available Questions"}</h4>
                  {loadingStates.questions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>{isSpanish ? "Cargando preguntas..." : "Loading questions..."}</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {getFilteredQuestions().map((question) => {
                        const questionType = getQuestionType(question)
                        return (
                          <div
                            key={question.id}
                            className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {isSpanish ? question.text_es : question.text_en}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {questionType
                                  ? isSpanish
                                    ? questionType.name_es
                                    : questionType.name_en
                                  : "Tipo desconocido"}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addFilterCondition(question.id)}
                              disabled={filterConditions.some((c) => c.question_id === question.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {isSpanish ? "Agregar" : "Add"}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Condiciones agregadas */}
                {filterConditions.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">{isSpanish ? "Condiciones de Filtro" : "Filter Conditions"}</h4>
                    {filterConditions.map((condition) => {
                      const question = getFilteredQuestions().find((q) => q.id === condition.question_id)
                      const questionType = question ? getQuestionType(question) : null
                      return (
                        <div key={condition.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">{condition.question_text}</h5>
                            <Button size="sm" variant="ghost" onClick={() => removeFilterCondition(condition.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {question && renderAnswerOptions(question, condition)}

                          {/* Mostrar respuestas seleccionadas para preguntas con opciones */}
                          {questionType &&
                            !questionType.key_name.startsWith("numbers_") &&
                            questionType.key_name !== "text" &&
                            condition.selected_answers.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {condition.selected_answers.map((answer, index) => (
                                  <Badge key={index} variant="secondary">
                                    {answer}
                                  </Badge>
                                ))}
                                <div className="text-xs text-gray-500 mt-1">
                                  {isSpanish
                                    ? `Se enviarán ${condition.selected_answers.length} filtros separados`
                                    : `${condition.selected_answers.length} separate filters will be sent`}
                                </div>
                              </div>
                            )}

                          {/* Mostrar respuesta de texto para preguntas de texto/numéricas */}
                          {questionType &&
                            (questionType.key_name === "text" || questionType.key_name.startsWith("numbers_")) &&
                            condition.text_answer && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-sm">
                                  {condition.text_answer}
                                </Badge>
                              </div>
                            )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botón siguiente */}
          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={filterConditions.length === 0 || filterConditions.some((c) => !isConditionComplete(c))}
            >
              {isSpanish ? "Siguiente" : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2: Selección de campos de resultado */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isSpanish ? "Seleccionar Campos de Resultado" : "Select Result Fields"}</CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Seleccione qué información desea obtener de los pacientes filtrados"
                  : "Select what information you want to retrieve from the filtered patients"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de preguntas disponibles */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">{isSpanish ? "Preguntas Disponibles" : "Available Questions"}</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getFilteredQuestions().map((question) => {
                    const questionType = getQuestionType(question)
                    return (
                      <div
                        key={question.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium">{isSpanish ? question.text_es : question.text_en}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {questionType
                              ? isSpanish
                                ? questionType.name_es
                                : questionType.name_en
                              : "Tipo desconocido"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addResultField(question.id)}
                          disabled={resultFields.some((field) => field.question_id === question.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {isSpanish ? "Agregar" : "Add"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Campos de resultado agregados */}
              {resultFields.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">{isSpanish ? "Campos de Resultado" : "Result Fields"}</h4>
                  {resultFields.map((field) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{field.question_text}</h5>
                        <Button size="sm" variant="ghost" onClick={() => removeResultField(field.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de navegación */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              {isSpanish ? "Anterior" : "Previous"}
            </Button>
            <Button onClick={executeQuery} disabled={resultFields.length === 0 || loadingStates.query}>
              {loadingStates.query ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{isSpanish ? "Ejecutando..." : "Executing..."}</span>
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {isSpanish ? "Ejecutar Consulta" : "Execute Query"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Paso 3: Resultados */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isSpanish ? "Resultados del Análisis" : "Analysis Results"}</CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Aquí se muestran los resultados del análisis basado en los filtros seleccionados"
                  : "Here are the results of the analysis based on the selected filters"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.query ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>{isSpanish ? "Cargando resultados..." : "Loading results..."}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {queryResults.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(queryResults[0]).map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResults.map((result, index) => (
                          <TableRow key={index}>
                            {Object.values(result).map((value, colIndex) => (
                              <TableCell key={colIndex}>{value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <span>{isSpanish ? "No hay resultados disponibles." : "No results available."}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón de exportación */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              {isSpanish ? "Anterior" : "Previous"}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                {isSpanish ? "Nueva Consulta" : "New Query"}
              </Button>
              <Button onClick={exportToCSV} disabled={queryResults.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {isSpanish ? "Exportar a CSV" : "Export to CSV"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
