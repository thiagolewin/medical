"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formsApi } from "@/lib/api"

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [forms, setForms] = useState([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true)
        const response = await formsApi.getForms()
        setForms(response || [])
      } catch (error) {
        console.error("Error fetching forms:", error)
        setForms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [])

  const filteredForms = forms.filter(
    (form) =>
      form.name_es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.key_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteForm = async () => {
    if (formToDelete !== null) {
      try {
        await formsApi.deleteForm(formToDelete)
        setForms(forms.filter((form) => form.id !== formToDelete))
        setFormToDelete(null)
        setIsDeleteDialogOpen(false)
      } catch (error) {
        console.error("Error eliminando formulario:", error)
        alert("Error al eliminar el formulario. Por favor, inténtelo de nuevo.")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando formularios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formularios</h1>
          <p className="text-muted-foreground">Gestione los formularios del sistema</p>
        </div>
        <Link href="/admin/forms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo formulario
          </Button>
        </Link>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar formularios..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="cards">Tarjetas</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="border-none p-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre (ES)</TableHead>
                    <TableHead>Nombre (EN)</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Preguntas</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No se encontraron formularios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell>{form.name_es}</TableCell>
                        <TableCell>{form.name_en}</TableCell>
                        <TableCell>{form.key_name}</TableCell>
                        <TableCell>{form.questionCount || 0}</TableCell>
                        <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/forms/${form.id}`}>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setFormToDelete(form.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cards" className="border-none p-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredForms.length === 0 ? (
              <p className="col-span-full text-center">No se encontraron formularios</p>
            ) : (
              filteredForms.map((form) => (
                <Card key={form.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{form.name_es}</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{form.description_es}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{form.key_name}</Badge>
                      <span className="text-muted-foreground">{form.questionCount || 0} preguntas</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/admin/forms/${form.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormToDelete(form.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este formulario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteForm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
