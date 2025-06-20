"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formsApi, questionTypesApi, questionsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

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
  numberRange?: NumberRange // Para almacenar temporalmente el rango numérico
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
    if (currentQuestion.questionTypeId === -1 && (!currentQuestion.numberRange || !currentQuestion.numberRange.min || !currentQuestion.numberRange.max)) {
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

  const handleDragEnd = (result: any) => {
    if (!result.destination || !currentQuestion) return

    const items = Array.from(currentQuestion.options)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Actualizar el orden de las opciones
    const updatedOptions = items.map((item, index) => ({
      ...item,
      orderInOption: index + 1,
    }))

    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    })
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
            numberRange: undefined
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
        const questionType = questionTypes.find((t) => t.id === question.questionTypeId) || 
                            { key_name: question.questionTypeId === -1 ? "numbers" : "" }
                            
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
      const question = questions.find(q => q.id === currentQuestion?.id)
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
        type.key_name === "\
