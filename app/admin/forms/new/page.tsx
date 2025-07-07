"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formsApi, questionTypesApi, questionsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit, GripVertical } from "lucide-react"

interface QuestionType {
  id: number
  key_name: string
  name_es: string
  name_en: string
}

interface NumberRange {
  min: number
  max: number
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
  includeOtherOption?: boolean
  numberRange?: NumberRange
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
  const { language } = useLanguage()
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
  const [isSaving, setIsSaving] = useState(false)

  // Estados para el diálogo de números
  const [isNumberDialogOpen, setIsNumberDialogOpen] = useState(false)
  const [numberRange, setNumberRange] = useState({ min: 1, max: 5 })

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

        // Filtrar tipos numbers específicos y agregar opción genérica
        const filteredTypes = types.filter((type) => !type.key_name.startsWith("numbers_"))

        // Agregar opción genérica para números
        const numbersOption = {
          id: -1, // ID temporal para identificar la opción genérica
          key_name: "numbers",
          name_es: "Números (rango personalizado)",
          name_en: "Numbers (custom range)",
        }

        setQuestionTypes([...filteredTypes, numbersOption])
      } catch (error) {
        console.error("Error cargando tipos de pregunta:", error)
        // Fallback a tipos estáticos
        setQuestionTypes([
          { id: 1, key_name: "text", name_es: "Texto", name_en: "Text" },
          { id: 2, key_name: "optionandtext", name_es: "Opciones + texto", name_en: "Options + text" },
          {
            id: 6,
            key_name: "optionmultipleandtext",
            name_es: "Opciones múltiples + texto",
            name_en: "Multiple Options + text",
          },
          {
            id: 4,
            key_name: "optiondropdownandtext",
            name_es: "Opciones multiples DropDown + texto",
            name_en: "Options DropDown + text",
          },
          { id: -1, key_name: "numbers", name_es: "Números (rango personalizado)", name_en: "Numbers (custom range)" },
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
      includeOtherOption: false,
    }
    setCurrentQuestion(newQuestion)
    setIsEditingQuestion(true)
  }

  const editQuestion = (question: Question) => {
    setCurrentQuestion({ ...question })
    setIsEditingQuestion(true)
  }

  const handleQuestionTypeChange = async (value: string) => {
    const typeId = Number.parseInt(value)

    if (typeId === -1) {
      // Es la opción genérica de números, abrir diálogo
      setIsNumberDialogOpen(true)
    } else {
      handleQuestionChange("questionTypeId", typeId)
      // Si cambiamos a un tipo que no es numérico, eliminamos el rango
      if (currentQuestion?.numberRange) {
        setCurrentQuestion({
          ...currentQuestion,
          questionTypeId: typeId,
          numberRange: undefined,
        })
      } else {
        handleQuestionChange("questionTypeId", typeId)
      }
    }
  }

  const confirmNumberRange = () => {
    if (!currentQuestion) return

    // Guardar el rango en la pregunta actual, pero mantener el tipo como -1 (temporal)
    setCurrentQuestion({
      ...currentQuestion,
      questionTypeId: -1, // Mantenemos el ID temporal
      numberRange: { ...numberRange }, // Guardamos el rango para usarlo después
    })

    setIsNumberDialogOpen(false)
  }

  const saveQuestion = () => {
    if (!currentQuestion) return

    // Validar campos obligatorios
    if (!currentQuestion.textEs || !currentQuestion.textEn) {
      alert(
        language === "es"
          ? "Por favor complete todos los campos obligatorios de la pregunta."
          : "Please complete all required question fields.",
      )
      return
    }

    // Si es una pregunta de selección, validar que tenga opciones
    const selectedType = questionTypes.find((t) => t.id === currentQuestion.questionTypeId)
    if (
      selectedType &&
      (selectedType.key_name === "optionandtext" ||
        selectedType.key_name === "optionmultipleandtext" ||
        selectedType.key_name === "optiondropdownandtext") &&
      currentQuestion.options.length === 0
    ) {
      alert(
        language === "es"
          ? "Las preguntas de selección deben tener al menos una opción."
          : "Selection questions must have at least one option.",
      )
      return
    }

    // Si es una pregunta numérica temporal, validar que tenga rango
    if (
      currentQuestion.questionTypeId === -1 &&
      (!currentQuestion.numberRange || !currentQuestion.numberRange.min || !currentQuestion.numberRange.max)
    ) {
      alert(
        language === "es"
          ? "Por favor configure el rango numérico para esta pregunta."
          : "Please configure the numeric range for this question.",
      )
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

  // Función para crear o encontrar un tipo de pregunta numérico
  const createOrFindNumberType = async (min: number, max: number) => {
    const keyName = `numbers_${min}_${max}`
    const nameEs = `Números del ${min} al ${max}`
    const nameEn = `Numbers from ${min} to ${max}`

    try {
      // Primero verificar si ya existe
      const existingTypes = await questionTypesApi.getQuestionTypes()
      const existingType = existingTypes.find((type) => type.key_name === keyName)

      if (existingType) {
        // Ya existe, usar ese ID
        console.log("Tipo de pregunta ya existe:", existingType)
        return existingType.id
      } else {
        // No existe, crear nuevo
        console.log("Creando nuevo tipo de pregunta:", { keyName, nameEs, nameEn })

        const newType = await questionTypesApi.createQuestionType({
          key_name: keyName,
          name_es: nameEs,
          name_en: nameEn,
        })

        console.log("Nuevo tipo creado:", newType)
        return newType.id
      }
    } catch (error) {
      console.error("Error creando/encontrando tipo de pregunta:", error)
      throw new Error(
        language === "es"
          ? `Error al crear el tipo de pregunta numérica ${min}-${max}`
          : `Error creating numeric question type ${min}-${max}`,
      )
    }
  }

  const saveForm = async () => {
    // Validar campos obligatorios del formulario
    if (!form.keyName || !form.nameEs || !form.nameEn) {
      alert(
        language === "es"
          ? "Por favor complete todos los campos obligatorios del formulario."
          : "Please complete all required form fields.",
      )
      return
    }

    // Validar que haya al menos una pregunta
    if (questions.length === 0) {
      alert(
        language === "es"
          ? "El formulario debe tener al menos una pregunta."
          : "The form must have at least one question.",
      )
      return
    }

    try {
      setIsSaving(true)

      // 1. Primero, crear todos los tipos de pregunta numéricos necesarios
      const questionsWithNumberTypes = [...questions]

      // Procesar todas las preguntas con tipo numérico temporal
      for (let i = 0; i < questionsWithNumberTypes.length; i++) {
        const question = questionsWithNumberTypes[i]

        if (question.questionTypeId === -1 && question.numberRange) {
          // Crear o encontrar el tipo de pregunta numérico
          const typeId = await createOrFindNumberType(question.numberRange.min, question.numberRange.max)

          // Actualizar la pregunta con el ID real
          questionsWithNumberTypes[i] = {
            ...question,
            questionTypeId: typeId,
            // Ya no necesitamos el numberRange
            numberRange: undefined,
          }
        }
      }

      // 2. Crear el formulario usando la API
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

      const createdFormId = formResponse.id

      // 3. Ahora crear las preguntas una por una con los tipos correctos
      for (const question of questionsWithNumberTypes) {
        const questionData = {
          form_id: createdFormId,
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

            console.log("Creando opción:", optionData)
            await questionsApi.addOption(questionResponse.id, optionData)
          }
        }

        // Si es una pregunta con opciones y se ha marcado incluir "Otra, especificar"
        const questionType = questionTypes.find((t) => t.id === question.questionTypeId) || {
          key_name: question.questionTypeId === -1 ? "numbers" : "",
        }

        if (
          questionType &&
          (questionType.key_name === "optionandtext" ||
            questionType.key_name === "optionmultipleandtext" ||
            questionType.key_name === "optiondropdownandtext") &&
          question.includeOtherOption
        ) {
          const otherOptionData = {
            key_name: `otra_${questionResponse.id}`,
            text_es: "Otra, especificar",
            text_en: "Other, specify",
            order_in_option: question.options.length + 1,
          }

          console.log("Agregando opción 'Otra, especificar':", otherOptionData)
          await questionsApi.addOption(questionResponse.id, otherOptionData)
        }
      }

      // Formulario creado exitosamente, redirigir
      router.push("/admin/forms")
    } catch (error) {
      console.error("Error creating form:", error)
      alert(
        language === "es"
          ? "Error al crear el formulario. Por favor, inténtelo de nuevo."
          : "Error creating form. Please try again.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const getQuestionTypeName = (typeId: number) => {
    if (typeId === -1) {
      // Es un tipo numérico temporal
      const question = questions.find((q) => q.id === currentQuestion?.id)
      if (question?.numberRange) {
        return language === "es"
          ? `Números del ${question.numberRange.min} al ${question.numberRange.max}`
          : `Numbers from ${question.numberRange.min} to ${question.numberRange.max}`
      }
      return language === "es" ? "Números (rango personalizado)" : "Numbers (custom range)"
    }

    const type = questionTypes.find((t) => t.id === typeId)
    return language === "es" ? type?.name_es : type?.name_en
  }

  const getQuestionTypeNameInList = (typeId: number, question: Question) => {
    if (typeId === -1 && question.numberRange) {
      // Es un tipo numérico temporal
      return language === "es"
        ? `Números del ${question.numberRange.min} al ${question.numberRange.max}`
        : `Numbers from ${question.numberRange.min} to ${question.numberRange.max}`
    }

    const type = questionTypes.find((t) => t.id === typeId)
    return language === "es" ? type?.name_es : type?.name_en
  }

  const requiresOptions = (typeId: number) => {
    const type = questionTypes.find((t) => t.id === typeId)
    return (
      type &&
      (type.key_name === "optionandtext" ||
        type.key_name === "optionmultipleandtext" ||
        type.key_name === "optiondropdownandtext")
    )
  }

  const supportsOtherOption = (typeId: number) => {
    const type = questionTypes.find((t) => t.id === typeId)
    return (
      type &&
      (type.key_name === "optionandtext" ||
        type.key_name === "optionmultipleandtext" ||
        type.key_name === "optiondropdownandtext")
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{language === "es" ? "Crear Nuevo Formulario" : "Create New Form"}</h1>
        <p className="text-gray-600 mt-2">
          {language === "es"
            ? "Complete la información del formulario y agregue las preguntas necesarias."
            : "Fill in the form information and add the necessary questions."}
        </p>
      </div>

      {/* Información del formulario */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{language === "es" ? "Información del Formulario" : "Form Information"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="keyName">{language === "es" ? "Nombre Clave" : "Key Name"} *</Label>
              <Input
                id="keyName"
                name="keyName"
                value={form.keyName}
                onChange={(e) => handleKeyNameChange(e, "form")}
                placeholder={language === "es" ? "ej: formulario_inicial" : "e.g: initial_form"}
              />
            </div>
            <div>
              <Label htmlFor="nameEs">{language === "es" ? "Nombre (Español)" : "Name (Spanish)"} *</Label>
              <Input
                id="nameEs"
                name="nameEs"
                value={form.nameEs}
                onChange={handleFormChange}
                placeholder={language === "es" ? "Nombre del formulario en español" : "Form name in Spanish"}
              />
            </div>
            <div>
              <Label htmlFor="nameEn">{language === "es" ? "Nombre (Inglés)" : "Name (English)"} *</Label>
              <Input
                id="nameEn"
                name="nameEn"
                value={form.nameEn}
                onChange={handleFormChange}
                placeholder={language === "es" ? "Nombre del formulario en inglés" : "Form name in English"}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="descriptionEs">
                {language === "es" ? "Descripción (Español)" : "Description (Spanish)"}
              </Label>
              <Textarea
                id="descriptionEs"
                name="descriptionEs"
                value={form.descriptionEs}
                onChange={handleFormChange}
                placeholder={
                  language === "es" ? "Descripción del formulario en español" : "Form description in Spanish"
                }
              />
            </div>
            <div>
              <Label htmlFor="descriptionEn">
                {language === "es" ? "Descripción (Inglés)" : "Description (English)"}
              </Label>
              <Textarea
                id="descriptionEn"
                name="descriptionEn"
                value={form.descriptionEn}
                onChange={handleFormChange}
                placeholder={language === "es" ? "Descripción del formulario en inglés" : "Form description in English"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de preguntas */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {language === "es" ? "Preguntas del Formulario" : "Form Questions"} ({questions.length})
          </CardTitle>
          <Button onClick={addNewQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            {language === "es" ? "Agregar Pregunta" : "Add Question"}
          </Button>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {language === "es"
                ? "No hay preguntas agregadas. Haga clic en 'Agregar Pregunta' para comenzar."
                : "No questions added. Click 'Add Question' to get started."}
            </p>
          ) : (
            <div className="space-y-4">
              {questions
                .sort((a, b) => a.orderInForm - b.orderInForm)
                .map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {index + 1}. {language === "es" ? question.textEs : question.textEn}
                        </span>
                        {question.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            {language === "es" ? "Requerida" : "Required"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => editQuestion(question)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteQuestion(question.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>{language === "es" ? "Tipo:" : "Type:"}</strong>{" "}
                        {getQuestionTypeNameInList(question.questionTypeId, question)}
                      </p>
                      <p>
                        <strong>{language === "es" ? "Clave:" : "Key:"}</strong> {question.keyName}
                      </p>
                      {question.options.length > 0 && (
                        <p>
                          <strong>{language === "es" ? "Opciones:" : "Options:"}</strong> {question.options.length}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para editar pregunta */}
      <Dialog open={isEditingQuestion} onOpenChange={setIsEditingQuestion}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentQuestion?.id && questions.some((q) => q.id === currentQuestion.id)
                ? language === "es"
                  ? "Editar Pregunta"
                  : "Edit Question"
                : language === "es"
                  ? "Nueva Pregunta"
                  : "New Question"}
            </DialogTitle>
          </DialogHeader>
          {currentQuestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questionKeyName">{language === "es" ? "Nombre Clave" : "Key Name"} *</Label>
                  <Input
                    id="questionKeyName"
                    value={currentQuestion.keyName}
                    onChange={(e) => handleKeyNameChange(e, "question")}
                    placeholder={language === "es" ? "ej: pregunta_edad" : "e.g: age_question"}
                  />
                </div>
                <div>
                  <Label htmlFor="questionType">{language === "es" ? "Tipo de Pregunta" : "Question Type"} *</Label>
                  {isLoadingTypes ? (
                    <div className="h-10 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <Select value={currentQuestion.questionTypeId.toString()} onValueChange={handleQuestionTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {language === "es" ? type.name_es : type.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questionTextEs">{language === "es" ? "Texto (Español)" : "Text (Spanish)"} *</Label>
                  <Textarea
                    id="questionTextEs"
                    value={currentQuestion.textEs}
                    onChange={(e) => handleQuestionChange("textEs", e.target.value)}
                    placeholder={language === "es" ? "Texto de la pregunta en español" : "Question text in Spanish"}
                  />
                </div>
                <div>
                  <Label htmlFor="questionTextEn">{language === "es" ? "Texto (Inglés)" : "Text (English)"} *</Label>
                  <Textarea
                    id="questionTextEn"
                    value={currentQuestion.textEn}
                    onChange={(e) => handleQuestionChange("textEn", e.target.value)}
                    placeholder={language === "es" ? "Texto de la pregunta en inglés" : "Question text in English"}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={currentQuestion.isRequired}
                  onCheckedChange={(checked) => handleQuestionChange("isRequired", checked)}
                />
                <Label htmlFor="isRequired">{language === "es" ? "Pregunta requerida" : "Required question"}</Label>
              </div>

              {/* Opciones para preguntas de selección */}
              {requiresOptions(currentQuestion.questionTypeId) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium">
                      {language === "es" ? "Opciones de Respuesta" : "Answer Options"}
                    </Label>
                    <Button type="button" onClick={addOption} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      {language === "es" ? "Agregar Opción" : "Add Option"}
                    </Button>
                  </div>

                  {currentQuestion.options.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {language === "es"
                        ? "No hay opciones agregadas. Haga clic en 'Agregar Opción' para comenzar."
                        : "No options added. Click 'Add Option' to get started."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentQuestion.options
                        .sort((a, b) => a.orderInOption - b.orderInOption)
                        .map((option, index) => (
                          <div key={option.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {language === "es" ? "Opción" : "Option"} {index + 1}
                              </span>
                              <Button type="button" variant="outline" size="sm" onClick={() => deleteOption(option.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">{language === "es" ? "Clave" : "Key"}</Label>
                                <Input
                                  value={option.keyName}
                                  onChange={(e) => handleOptionKeyNameChange(option.id, e.target.value)}
                                  placeholder={language === "es" ? "ej: opcion_a" : "e.g: option_a"}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">
                                  {language === "es" ? "Texto (Español)" : "Text (Spanish)"}
                                </Label>
                                <Input
                                  value={option.textEs}
                                  onChange={(e) => updateOption(option.id, "textEs", e.target.value)}
                                  placeholder={language === "es" ? "Texto en español" : "Text in Spanish"}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">
                                  {language === "es" ? "Texto (Inglés)" : "Text (English)"}
                                </Label>
                                <Input
                                  value={option.textEn}
                                  onChange={(e) => updateOption(option.id, "textEn", e.target.value)}
                                  placeholder={language === "es" ? "Texto en inglés" : "Text in English"}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Opción para incluir "Otra, especificar" */}
                  {supportsOtherOption(currentQuestion.questionTypeId) && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeOtherOption"
                        checked={currentQuestion.includeOtherOption || false}
                        onCheckedChange={(checked) => handleQuestionChange("includeOtherOption", checked)}
                      />
                      <Label htmlFor="includeOtherOption">
                        {language === "es" ? "Incluir opción 'Otra, especificar'" : "Include 'Other, specify' option"}
                      </Label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditingQuestion(false)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="button" onClick={saveQuestion}>
                  {language === "es" ? "Guardar Pregunta" : "Save Question"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para configurar rango numérico */}
      <Dialog open={isNumberDialogOpen} onOpenChange={setIsNumberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "es" ? "Configurar Rango Numérico" : "Configure Numeric Range"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minValue">{language === "es" ? "Valor Mínimo" : "Minimum Value"}</Label>
                <Input
                  id="minValue"
                  type="number"
                  value={numberRange.min}
                  onChange={(e) => setNumberRange({ ...numberRange, min: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxValue">{language === "es" ? "Valor Máximo" : "Maximum Value"}</Label>
                <Input
                  id="maxValue"
                  type="number"
                  value={numberRange.max}
                  onChange={(e) => setNumberRange({ ...numberRange, max: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsNumberDialogOpen(false)}>
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button type="button" onClick={confirmNumberRange}>
                {language === "es" ? "Confirmar" : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/forms")}>
          {language === "es" ? "Cancelar" : "Cancel"}
        </Button>
        <Button type="button" onClick={saveForm} disabled={isSaving}>
          {isSaving
            ? language === "es"
              ? "Guardando..."
              : "Saving..."
            : language === "es"
              ? "Crear Formulario"
              : "Create Form"}
        </Button>
      </div>
    </div>
  )
}
