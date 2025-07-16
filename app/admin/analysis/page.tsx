"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, Search, Filter, BarChart3, HelpCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { protocolsApi, questionsApi, questionTypesApi, analysisApi, formsApi } from "@/lib/api"

interface Protocol {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

interface Form {
  id: number
  form_id: number
  key_name: string
  name_es: string
  name_en: string
  protocol_id: number
}

interface Question {
  id: number
  key_name: string
  text_es: string
  text_en: string
  question_type_id: number
  form_id: number
  options?: Option[]
}

interface Option {
  id: number
  key_name: string
  text_es: string
  text_en: string
  question_id: number
}

interface QuestionType {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

// 1. Estado de los filtros
interface FilterCondition {
  questionId: number;
  value: string; // id de la opción seleccionada como string, o "" si nada seleccionado
}

interface AnalysisResult {
  patient_id: number
  question_id: number
  answer_text: string
  form_instance_id: number
  total: string
}

export default function AnalysisPage() {
  const { language } = useLanguage()

  // Estados para datos
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])

  // Estados para filtros
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all")
  const [selectedForm, setSelectedForm] = useState<string>("all")
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [selectedResultFields, setSelectedResultFields] = useState<number[]>([])

  // Estados para resultados
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Estados de carga
  const [loadingStates, setLoadingStates] = useState({
    protocols: false,
    forms: false,
    questions: false,
    questionTypes: false,
  })

  // Estados de error
  const [error, setError] = useState<string>("")

  // Textos traducidos
  const t = {
    title: language === "es" ? "Análisis de Datos" : "Data Analysis",
    subtitle: language === "es"
      ? "Analice y filtre los datos de respuestas de pacientes. Los filtros y campos son opcionales."
      : "Analyze and filter patient response data. Filters and fields are optional.",
    flexibleQueries: language === "es" ? "Consultas flexibles:" : "Flexible queries:",
    flexibleQueriesDesc: language === "es"
      ? "Puede ejecutar consultas sin filtros ni campos específicos para obtener todos los datos disponibles."
      : "You can run queries without filters or specific fields to get all available data.",
    dataSelection: language === "es" ? "Selección de Datos" : "Data Selection",
    protocolOptional: language === "es" ? "Protocolo (Opcional)" : "Protocol (Optional)",
    formOptional: language === "es" ? "Formulario (Opcional)" : "Form (Optional)",
    selectProtocol: language === "es" ? "Seleccionar protocolo..." : "Select protocol...",
    selectForm: language === "es" ? "Seleccionar formulario..." : "Select form...",
    allProtocols: language === "es" ? "Todos los protocolos" : "All protocols",
    allForms: language === "es" ? "Todos los formularios" : "All forms",
    responseFilters: language === "es" ? "Filtros de Respuestas (Opcional)" : "Response Filters (Optional)",
    addFilter: language === "es" ? "Agregar Filtro" : "Add Filter",
    noFiltersConfigured: language === "es"
      ? "No hay filtros configurados. Los filtros son opcionales - puede ejecutar consultas sin filtros."
      : "No filters configured. Filters are optional - you can run queries without filters.",
    filter: language === "es" ? "Filtro" : "Filter",
    remove: language === "es" ? "Eliminar" : "Remove",
    question: language === "es" ? "Pregunta" : "Question",
    value: language === "es" ? "Valor" : "Value",
    select: language === "es" ? "Seleccionar..." : "Select...",
    enterValue: language === "es" ? "Ingrese valor..." : "Enter value...",
    type: language === "es" ? "Tipo: " : "Type: ",
    resultFields: language === "es" ? "Campos de Resultado (Opcional)" : "Result Fields (Optional)",
    selectFormToSeeQuestions: language === "es"
      ? "Seleccione un formulario para ver las preguntas disponibles. Los campos son opcionales."
      : "Select a form to see available questions. Fields are optional.",
    selectQuestionsForResults: language === "es"
      ? "Seleccione las preguntas que desea incluir en los resultados. Si no selecciona ninguna, se mostrarán todas."
      : "Select the questions you want to include in the results. If none selected, all will be shown.",
    analyzing: language === "es" ? "Analizando..." : "Analyzing...",
    executeAnalysis: language === "es" ? "Ejecutar Análisis" : "Run Analysis",
    analysisResults: language === "es" ? "Resultados del Análisis" : "Analysis Results",
    exportCSV: language === "es" ? "Exportar CSV" : "Export CSV",
    noResultsFound: language === "es"
      ? "No se encontraron resultados para los criterios especificados."
      : "No results found for the specified criteria.",
    records: language === "es" ? "Registros" : "Records",
    uniquePatients: language === "es" ? "Pacientes únicos" : "Unique patients",
    uniqueQuestions: language === "es" ? "Preguntas únicas" : "Unique questions",
    totalResponses: language === "es" ? "Total respuestas" : "Total responses",
    patientId: language === "es" ? "ID Paciente" : "Patient ID",
    answer: language === "es" ? "Respuesta" : "Answer",
    instanceId: language === "es" ? "ID Instancia" : "Instance ID",
    total: language === "es" ? "Total" : "Total",
    loading: language === "es" ? "Cargando..." : "Loading...",
    errorExecutingAnalysis: language === "es" ? "Error al ejecutar el análisis" : "Error running analysis",
    errorLoadingData: language === "es" ? "Error al cargar datos" : "Error loading data",
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setError("")

      // Cargar protocolos
      setLoadingStates((prev) => ({ ...prev, protocols: true }))
      const protocolsData = await protocolsApi.getProtocols()
      setProtocols(protocolsData)

      // Cargar tipos de pregunta
      setLoadingStates((prev) => ({ ...prev, questionTypes: true }))
      const typesData = await questionTypesApi.getQuestionTypes()
      setQuestionTypes(typesData)
    } catch (error) {
      setError(`${t.errorLoadingData}: ${error}`)
    } finally {
      setLoadingStates((prev) => ({ ...prev, protocols: false, questionTypes: false }))
    }
  }

  // Cargar formularios cuando se selecciona un protocolo
  useEffect(() => {
    if (selectedProtocol !== "all") {
      loadForms(Number(selectedProtocol))
    } else {
      setForms([])
      setSelectedForm("all")
    }
  }, [selectedProtocol])

  // Cargar preguntas cuando se selecciona un formulario
  useEffect(() => {
    if (selectedForm !== "all") {
      loadQuestions(Number(selectedForm))
    } else {
      setQuestions([])
      setFilterConditions([])
      setSelectedResultFields([])
    }
  }, [selectedForm])

  const loadForms = async (protocolId: number) => {
    try {
      setLoadingStates((prev) => ({ ...prev, forms: true }))
      setError("")

      // Usar el endpoint correcto: GET /protocols/{protocolId}/forms
      const formsData = await protocolsApi.getProtocolForms(protocolId)

      // Obtener detalles completos de cada formulario usando su form_id
      const formsWithDetails = await Promise.all(
        formsData.map(async (pf: any) => {
          try {
            const formDetails = await formsApi.getForm(pf.form_id)
            return {
              id: pf.id, // Usar el id único de la asignación
              form_id: pf.form_id, // Agregar el form_id base
              key_name: formDetails.key_name || `form_${pf.form_id}`,
              name_es: pf.form_name_es || formDetails.name_es,
              name_en: pf.form_name_en || formDetails.name_en,
              protocol_id: pf.protocol_id,
            }
          } catch (error) {
            return {
              id: pf.id, // Usar el id único de la asignación
              form_id: pf.form_id, // Agregar el form_id base
              key_name: `form_${pf.form_id}`,
              name_es: pf.form_name_es,
              name_en: pf.form_name_en,
              protocol_id: pf.protocol_id,
            }
          }
        }),
      )

      setForms(formsWithDetails)
    } catch (error) {
      setError(`${t.errorLoadingData} formularios: ${error}`)
      setForms([])
    } finally {
      setLoadingStates((prev) => ({ ...prev, forms: false }))
    }
  }

  const loadQuestions = async (formId: number) => {
    try {
      setLoadingStates((prev) => ({ ...prev, questions: true }))
      setError("")
      const questionsData = await questionsApi.getQuestionsByForm(formId)

      // Cargar opciones para cada pregunta
      const questionsWithOptions = await Promise.all(
        questionsData.map(async (question: Question) => {
          try {
            const options = await questionsApi.getQuestionOptions(question.id)
            return { ...question, options }
          } catch (error) {
            return { ...question, options: [] }
          }
        }),
      )

      setQuestions(questionsWithOptions)
    } catch (error) {
      setError(`${t.errorLoadingData} preguntas: ${error}`)
    } finally {
      setLoadingStates((prev) => ({ ...prev, questions: false }))
    }
  }

  const addFilterCondition = () => {
    if (questions.length === 0) return

    const newCondition: FilterCondition = {
      questionId: questions[0].id,
      value: "",
    }

    setFilterConditions([...filterConditions, newCondition])
  }

  // 3. updateFilterCondition simplificado
  const updateFilterCondition = (index: number, field: keyof FilterCondition, value: any) => {
    const updated = [...filterConditions];
    updated[index] = { ...updated[index], [field]: value };
    // Si cambia la pregunta, limpiar el valor
    if (field === "questionId") {
      updated[index].value = "";
    }
    setFilterConditions(updated);
  };

  const removeFilterCondition = (index: number) => {
    setFilterConditions(filterConditions.filter((_, i) => i !== index))
  }

  const toggleResultField = (questionId: number) => {
    setSelectedResultFields((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const getQuestionType = (questionTypeId: number) => {
    return questionTypes.find((type) => type.id === questionTypeId)
  }

  const isNumericQuestion = (questionTypeId: number) => {
    const type = getQuestionType(questionTypeId)
    return type?.key_name.startsWith("numbers")
  }

  const hasOptions = (questionTypeId: number) => {
    const type = getQuestionType(questionTypeId)
    return (
      type &&
      (type.key_name === "optionandtext" ||
        type.key_name === "optionmultipleandtext" ||
        type.key_name === "optiondropdownandtext")
    )
  }

  const isMultipleChoice = (questionTypeId: number) => {
    const type = getQuestionType(questionTypeId)
    return type?.key_name === "optionmultipleandtext"
  }

  // Detectar si una opción es "Otra"
  const isOtherOption = (option: Option) => {
    return option.key_name === "other" || option.key_name.startsWith("otra_")
  }

  // 4. Al enviar el análisis, armar el payload con el texto de la opción seleccionada
  const executeAnalysis = async () => {
    try {
      setIsLoading(true);
      setHasSearched(true);
      setError("");
      const filtros: any[] = [];
      filterConditions.forEach((condition) => {
        const question = questions.find((q) => q.id === condition.questionId);
        let answerText = "";
        if (question && question.options && condition.value) {
          const option = question.options.find((opt) => opt.id.toString() === condition.value);
          if (option) {
            answerText = option.text_es; // Siempre en español
          }
        }
        filtros.push({
          idForm: question?.form_id || 0,
          idProtocolo: selectedProtocol !== "all" ? Number(selectedProtocol) : 0,
          idPregunta: condition.questionId,
          anwerText: answerText,
        });
      });
      const traer = selectedResultFields.length > 0 ? selectedResultFields : [];
      const payload = { filtros, traer };
      const analysisResults = await analysisApi.executeAnalysis(payload);
      setResults(analysisResults || []);
    } catch (error) {
      setError(`${t.errorExecutingAnalysis}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return

    // Crear headers
    const headers = [
      t.patientId,
      language === "es" ? "ID Pregunta" : "Question ID",
      t.question,
      t.answer,
      t.instanceId,
      t.total,
    ]

    // Crear filas con información enriquecida
    const rows = results.map((result) => {
      const question = questions.find((q) => q.id === result.question_id)
      const questionText = question
        ? language === "es"
          ? question.text_es
          : question.text_en
        : `Question ${result.question_id}`

      return [
        result.patient_id,
        result.question_id,
        `"${questionText}"`,
        `"${result.answer_text}"`,
        result.form_instance_id,
        result.total,
      ]
    })

    // Crear CSV
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    // Descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `analysis_results_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calcular estadísticas
  const uniquePatients = new Set(results.map((r) => r.patient_id)).size
  const uniqueQuestions = new Set(results.map((r) => r.question_id)).size
  const totalResponses = results.reduce((sum, r) => sum + Number(r.total), 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            {t.title}
          </h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Información sobre consultas flexibles */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t.flexibleQueries}</p>
              <p>{t.flexibleQueriesDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección de Protocolo y Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t.dataSelection}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t.protocolOptional}</Label>
              {loadingStates.protocols ? (
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              ) : (
                <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectProtocol} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allProtocols}</SelectItem>
                    {protocols.map((protocol) => (
                      <SelectItem key={protocol.id} value={protocol.id.toString()}>
                        {language === "es" ? protocol.name_es : protocol.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>{t.formOptional}</Label>
              {loadingStates.forms ? (
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              ) : (
                <Select value={selectedForm} onValueChange={setSelectedForm} disabled={selectedProtocol === "all"}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectForm} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allForms}</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={`form-${form.id}`} value={form.form_id.toString()}>
                        {language === "es" ? form.name_es : form.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Preguntas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {t.responseFilters}
            </span>
            <Button onClick={addFilterCondition} size="sm" disabled={questions.length === 0}>
              {t.addFilter}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStates.questions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filterConditions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.noFiltersConfigured}</p>
          ) : (
            <div className="space-y-4">
              {filterConditions.map((condition, index) => {
                const question = questions.find((q) => q.id === condition.questionId);
                return (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {t.filter} {index + 1}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => removeFilterCondition(index)}>
                        {t.remove}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Pregunta */}
                      <div>
                        <Label className="text-sm">{t.question}</Label>
                        <Select
                          value={condition.questionId.toString()}
                          onValueChange={(value) => updateFilterCondition(index, "questionId", Number(value))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {questions.map((q) => (
                              <SelectItem key={q.id} value={q.id.toString()}>{language === "es" ? q.text_es : q.text_en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Valor */}
                      <div>
                        <Label className="text-sm">{t.value}</Label>
                        {question && question.options && question.options.length > 0 ? (
                          <Select
                            value={condition.value}
                            onValueChange={(value) => updateFilterCondition(index, "value", value)}
                          >
                            <SelectTrigger><SelectValue placeholder={t.select} /></SelectTrigger>
                            <SelectContent>
                              {question.options.map((option) => (
                                <SelectItem key={option.id} value={option.id.toString()}>
                                  {language === "es" ? option.text_es : option.text_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={condition.value}
                            onChange={e => updateFilterCondition(index, "value", e.target.value)}
                            placeholder={t.enterValue}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campos de Resultado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            {t.resultFields}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStates.questions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.selectFormToSeeQuestions}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t.selectQuestionsForResults}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {questions.map((question) => (
                  <div key={question.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedResultFields.includes(question.id)}
                      onCheckedChange={() => toggleResultField(question.id)}
                    />
                    <span className="text-sm">{language === "es" ? question.text_es : question.text_en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de Análisis */}
      <div className="flex justify-center">
        <Button onClick={executeAnalysis} disabled={isLoading} size="lg" className="min-w-48">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.analyzing}
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              {t.executeAnalysis}
            </>
          )}
        </Button>
      </div>

      {/* Resultados */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t.analysisResults}
              </CardTitle>
              {results.length > 0 && (
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  {t.exportCSV}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t.noResultsFound}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                    <div className="text-sm text-blue-800">{t.records}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{uniquePatients}</div>
                    <div className="text-sm text-green-800">{t.uniquePatients}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{uniqueQuestions}</div>
                    <div className="text-sm text-purple-800">{t.uniqueQuestions}</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{totalResponses}</div>
                    <div className="text-sm text-orange-800">{t.totalResponses}</div>
                  </div>
                </div>

                {/* Tabla de resultados */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.patientId}</TableHead>
                        <TableHead>{t.question}</TableHead>
                        <TableHead>{t.answer}</TableHead>
                        <TableHead>{t.instanceId}</TableHead>
                        <TableHead className="text-center">{t.total}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => {
                        const question = questions.find((q) => q.id === result.question_id)
                        const questionText = question
                          ? language === "es"
                            ? question.text_es
                            : question.text_en
                          : `Question ${result.question_id}`

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{result.patient_id}</TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <span className="text-sm cursor-help" title={questionText}>
                                  {questionText.length > 50 ? `${questionText.substring(0, 50)}...` : questionText}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <span className="text-sm">
                                  {result.answer_text.length > 100
                                    ? `${result.answer_text.substring(0, 100)}...`
                                    : result.answer_text}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{result.form_instance_id}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{result.total}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
