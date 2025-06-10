"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Save, Trash2, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { formsApi, questionTypesApi, questionsApi } from "@/lib/api"

interface QuestionType {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

interface Question {
  id: number
  keyName: string
  textEs: string
  textEn: string
  questionTypeId: number
  isRequired: boolean
  orderInForm: number
  options: Option[]
}

interface Option {
  id: number
  keyName: string
  textEs: string
  textEn: string
  orderInOption: number
}

export default function NewFormPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("spanish")
  const [form, setForm] = useState({
    keyName: "",
    nameEs: "",
    nameEn: "",
    descriptionEs: "",
    descriptionEn: "",
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isEditingQuestion, setIsEditingQuestion] = useState(false)
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)

  // Función para manejar cambios en keyName - ahora permite _ pero no -
  const handleKeyNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z_]/g, "")
    if (field === "form") {
      setForm({ ...form, keyName: value })
    } else if (field === "question" && currentQuestion) {
      setCurrentQuestion({ ...currentQuestion, keyName: value })
    }
  }

  const handleOptionKeyNameChange = (optionId: number, value: string) => {
    const filteredValue = value.toLowerCase().replace(/[^a-z_]/g, "")
    updateOption(optionId, "keyName", filteredValue)
  }

  // Cargar tipos de pregunta al montar el componente
  useEffect(() => {
    const fetchQuestionTypes = async () => {
      try {
        setIsLoadingTypes(true)
        const types = await questionTypesApi.getQuestionTypes()
        setQuestionTypes(types)
      } catch (error) {
        console.error("Error cargando tipos de pregunta:", error)
        // Fallback a tipos estáticos si falla la API
        setQuestionTypes([
          { id: 1, key_name: "text", name_es: "Texto", name_en: "Text" },
          { id: 2, key_name: "number", name_es: "Numérico", name_en: "Number" },
          { id: 3, key_name: "single_choice", name_es: "Selección única", name_en: "Single choice" },
          { id: 4, key_name: "multiple_choice", name_es: "Selección múltiple", name_en: "Multiple choice" },
          { id: 5, key_name: "date", name_es: "Fecha", name_en: "Date" },
          { id: 6, key_name: "scale", name_es: "Escala", name_en: "Scale" },
        ])
      } finally {
        setIsLoadingTypes(false)
      }
    }

    fetchQuestionTypes()
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      keyName: "",
      textEs: "",
      textEn: "",
      questionTypeId: questionTypes.length > 0 ? questionTypes[0].id : 1,
      isRequired: false,
      orderInForm: questions.length + 1,
      options: [],
    }
    setCurrentQuestion(newQuestion)
    setIsEditingQuestion(true)
  }

  const editQuestion = (question: Question) => {
    setCurrentQuestion({ ...question })
    setIsEditingQuestion(true)
  }

  const saveQuestion = () => {
    if (!currentQuestion) return

    // Validar campos obligatorios
    if (!currentQuestion.textEs || !currentQuestion.textEn) {
      alert("Por favor complete todos los campos obligatorios de la pregunta.")
      return
    }

    // Si es una pregunta de selección, validar que tenga opciones
    const selectedType = questionTypes.find((t) => t.id === currentQuestion.questionTypeId)
    if (
      selectedType &&
      (selectedType.key_name === "single_choice" || selectedType.key_name === "multiple_choice") &&
      currentQuestion.options.length === 0
    ) {
      alert("Las preguntas de selección deben tener al menos una opción.")
      return
    }

    const updatedQuestions = questions.some((q) => q.id === currentQuestion.id)
      ? questions.map((q) => (q.id === currentQuestion.id ? currentQuestion : q))
      : [...questions, currentQuestion]

    setQuestions(updatedQuestions)
    setCurrentQuestion(null)
    setIsEditingQuestion(false)
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const addOption = () => {
    if (!currentQuestion) return

    const newOption: Option = {
      id: Date.now(),
      keyName: "",
      textEs: "",
      textEn: "",
      orderInOption: currentQuestion.options.length + 1,
    }

    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, newOption],
    })
  }

  const updateOption = (optionId: number, field: string, value: string) => {
    if (!currentQuestion) return

    const updatedOptions = currentQuestion.options.map((opt) =>
      opt.id === optionId ? { ...opt, [field]: value } : opt,
    )

    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    })
  }

  const deleteOption = (optionId: number) => {
    if (!currentQuestion) return

    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((opt) => opt.id !== optionId),
    })
  }

  const handleQuestionChange = (field: string, value: any) => {
    if (!currentQuestion) return
    setCurrentQuestion({ ...currentQuestion, [field]: value })
  }

  // Modificar la función saveForm para validar la clave única
  const saveForm = async () => {
    // Validar campos obligatorios del formulario
    if (!form.keyName || !form.nameEs || !form.nameEn) {
      alert("Por favor complete todos los campos obligatorios del formulario.")
      return
    }

    // Validar que haya al menos una pregunta
    if (questions.length === 0) {
      alert("El formulario debe tener al menos una pregunta.")
      return
    }

    try {
      // Crear el formulario usando la API
      const formData = {
        key_name: form.keyName,
        name_es: form.nameEs,
        name_en: form.nameEn,
        description_es: form.descriptionEs,
        description_en: form.descriptionEn,
      }

      console.log("Creando formulario:", formData)
      const formResponse = await formsApi.createForm(formData)
      console.log("Formulario creado:", formResponse)

      const formId = formResponse.id

      // Ahora crear las preguntas una por una
      for (const question of questions) {
        const questionData = {
          form_id: formId,
          key_name: question.keyName,
          text_es: question.textEs,
          text_en: question.textEn,
          question_type_id: question.questionTypeId,
          is_required: question.isRequired,
          order_in_form: question.orderInForm,
        }

        console.log("Creando pregunta:", questionData)
        const questionResponse = await questionsApi.createQuestion(questionData)
        console.log("Pregunta creada:", questionResponse)

        // Si la pregunta tiene opciones, crearlas
        if (question.options && question.options.length > 0) {
          for (const option of question.options) {
            const optionData = {
              key_name: option.keyName,
              text_es: option.textEs,
              text_en: option.textEn,
              order_in_option: option.orderInOption,
            }

            await questionsApi.addOption(questionResponse.id, optionData)
          }
        }
      }

      // Formulario creado exitosamente, redirigir
      // Redirigir a la lista de formularios
      router.push("/admin/forms")
    } catch (error) {
      console.error("Error creating form:", error)
      alert("Error al crear el formulario. Por favor, inténtelo de nuevo.")
    }
  }

  const getQuestionTypeName = (typeId: number) => {
    const type = questionTypes.find((t) => t.id === typeId)
    return activeTab === "spanish" ? type?.name_es : type?.name_en
  }

  const requiresOptions = (typeId: number) => {
    const type = questionTypes.find((t) => t.id === typeId)
    return type && (type.key_name === "single_choice" || type.key_name === "multiple_choice")
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
            <h1 className="text-3xl font-bold tracking-tight">Nuevo formulario</h1>
            <p className="text-muted-foreground">Cree un nuevo formulario para recopilar información</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del formulario</CardTitle>
          <CardDescription>Ingrese la información básica del formulario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyName">Clave única</Label>
            <Input
              id="keyName"
              name="keyName"
              placeholder="ej: initial_evaluation"
              value={form.keyName}
              onChange={(e) => handleKeyNameChange(e, "form")}
            />
            <p className="text-sm text-muted-foreground">
              Identificador único para el formulario (solo letras minúsculas y guiones bajos)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEs">Nombre (Español)</Label>
              <Input
                id="nameEs"
                name="nameEs"
                placeholder="ej: Evaluación Inicial"
                value={form.nameEs}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameEn">Nombre (Inglés)</Label>
              <Input
                id="nameEn"
                name="nameEn"
                placeholder="ej: Initial Evaluation"
                value={form.nameEn}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionEs">Descripción (Español)</Label>
              <Textarea
                id="descriptionEs"
                name="descriptionEs"
                placeholder="Descripción del formulario..."
                value={form.descriptionEs}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">Descripción (Inglés)</Label>
              <Textarea
                id="descriptionEn"
                name="descriptionEn"
                placeholder="Form description..."
                value={form.descriptionEn}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Preguntas</h2>
        <Button onClick={addNewQuestion} disabled={isEditingQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir pregunta
        </Button>
      </div>

      {isEditingQuestion && currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>
              {questions.some((q) => q.id === currentQuestion.id) ? "Editar pregunta" : "Nueva pregunta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionKeyName">Clave única</Label>
              <Input
                id="questionKeyName"
                value={currentQuestion.keyName}
                onChange={(e) => handleKeyNameChange(e, "question")}
                placeholder="ej: pain_level"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">Tipo de pregunta</Label>
              <Select
                value={currentQuestion.questionTypeId.toString()}
                onValueChange={(value) => handleQuestionChange("questionTypeId", Number.parseInt(value))}
                disabled={isLoadingTypes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTypes ? "Cargando tipos..." : "Seleccione un tipo"} />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {activeTab === "spanish" ? type.name_es : type.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionTextEs">Texto de la pregunta (Español)</Label>
                <Textarea
                  id="questionTextEs"
                  value={currentQuestion.textEs}
                  onChange={(e) => handleQuestionChange("textEs", e.target.value)}
                  placeholder="ej: ¿Cuál es su nivel de dolor?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="questionTextEn">Texto de la pregunta (Inglés)</Label>
                <Textarea
                  id="questionTextEn"
                  value={currentQuestion.textEn}
                  onChange={(e) => handleQuestionChange("textEn", e.target.value)}
                  placeholder="ej: What is your pain level?"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={currentQuestion.isRequired}
                onCheckedChange={(checked) => handleQuestionChange("isRequired", checked)}
              />
              <Label htmlFor="isRequired">Obligatoria</Label>
            </div>

            {/* Opciones para preguntas de selección */}
            {requiresOptions(currentQuestion.questionTypeId) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Opciones</Label>
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-2 h-3 w-3" />
                    Añadir opción
                  </Button>
                </div>

                {currentQuestion.options.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay opciones. Añada al menos una opción.</p>
                ) : (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <div key={option.id} className="border p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Opción {option.orderInOption}</Label>
                          <Button variant="ghost" size="icon" onClick={() => deleteOption(option.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={option.keyName}
                            onChange={(e) => handleOptionKeyNameChange(option.id, e.target.value)}
                            placeholder="clave_de_la_opcion"
                            className="mb-2"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                              value={option.textEs}
                              onChange={(e) => updateOption(option.id, "textEs", e.target.value)}
                              placeholder="Texto en español"
                            />
                            <Input
                              value={option.textEn}
                              onChange={(e) => updateOption(option.id, "textEn", e.target.value)}
                              placeholder="Text in English"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuestion(null)
                setIsEditingQuestion(false)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={saveQuestion}>Guardar pregunta</Button>
          </CardFooter>
        </Card>
      )}

      {questions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Preguntas del formulario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between border p-4 rounded-md">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {index + 1}. {activeTab === "spanish" ? question.textEs : question.textEn}
                      </span>
                      {question.isRequired && <span className="text-red-500 text-sm">*</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Tipo:</span> {getQuestionTypeName(question.questionTypeId)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Clave:</span> {question.keyName}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => editQuestion(question)}
                      disabled={isEditingQuestion}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteQuestion(question.id)}
                      disabled={isEditingQuestion}
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
            <p className="mb-4 text-muted-foreground">
              No hay preguntas en este formulario. Añada al menos una pregunta.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={saveForm}>
          <Save className="mr-2 h-4 w-4" />
          Guardar formulario
        </Button>
      </div>
    </div>
  )
}
