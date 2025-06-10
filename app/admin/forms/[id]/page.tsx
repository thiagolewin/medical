"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { formsApi } from "@/lib/api"

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId = Number.parseInt(params.id as string)

  const [form, setForm] = useState({
    keyName: "",
    nameEs: "",
    nameEn: "",
    descriptionEs: "",
    descriptionEn: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setIsLoading(true)
        const formData = await formsApi.getForm(formId)
        setForm({
          keyName: formData.key_name || "",
          nameEs: formData.name_es || "",
          nameEn: formData.name_en || "",
          descriptionEs: formData.description_es || "",
          descriptionEn: formData.description_en || "",
        })
      } catch (error) {
        console.error("Error cargando formulario:", error)
        alert("Error al cargar el formulario")
      } finally {
        setIsLoading(false)
      }
    }

    if (formId) {
      fetchForm()
    }
  }, [formId])

  const handleKeyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z_]/g, "")
    setForm({ ...form, keyName: value })
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const saveForm = async () => {
    // Validar campos obligatorios del formulario
    if (!form.keyName || !form.nameEs || !form.nameEn) {
      alert("Por favor complete todos los campos obligatorios del formulario.")
      return
    }

    try {
      const formData = {
        key_name: form.keyName,
        name_es: form.nameEs,
        name_en: form.nameEn,
        description_es: form.descriptionEs,
        description_en: form.descriptionEn,
      }

      console.log("Actualizando formulario:", formData)
      await formsApi.updateForm(formId, formData)
      console.log("Formulario actualizado exitosamente")

      // Redirigir a la lista de formularios
      router.push("/admin/forms")
    } catch (error) {
      console.error("Error updating form:", error)
      alert("Error al actualizar el formulario. Por favor, inténtelo de nuevo.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Cargando formulario...</div>
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
            <h1 className="text-3xl font-bold tracking-tight">Editar formulario</h1>
            <p className="text-muted-foreground">Modifique la información del formulario</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del formulario</CardTitle>
          <CardDescription>Modifique la información básica del formulario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyName">Clave única</Label>
            <Input
              id="keyName"
              name="keyName"
              placeholder="ej: initial_evaluation"
              value={form.keyName}
              onChange={handleKeyNameChange}
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

      <div className="flex justify-end space-x-4">
        <Link href="/admin/forms">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={saveForm}>
          <Save className="mr-2 h-4 w-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
