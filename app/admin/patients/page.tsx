"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { patientsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { language } = useLanguage();
  const t = {
    title: language === "es" ? "Pacientes" : "Patients",
    subtitle: language === "es" ? "Gestione los pacientes del sistema" : "Manage system patients",
    new: language === "es" ? "Nuevo paciente" : "New Patient",
    search: language === "es" ? "Buscar pacientes..." : "Search patients...",
    list: language === "es" ? "Lista" : "List",
    cards: language === "es" ? "Tarjetas" : "Cards",
    name: language === "es" ? "Nombre" : "Name",
    email: language === "es" ? "Email" : "Email",
    dob: language === "es" ? "Fecha de nacimiento" : "Date of Birth",
    actions: language === "es" ? "Acciones" : "Actions",
    edit: language === "es" ? "Editar" : "Edit",
    delete: language === "es" ? "Eliminar" : "Delete",
    notFound: language === "es" ? "No se encontraron pacientes" : "No patients found",
    loading: language === "es" ? "Cargando pacientes..." : "Loading patients...",
    gender: language === "es" ? "Género" : "Gender",
    male: language === "es" ? "Masculino" : "Male",
    female: language === "es" ? "Femenino" : "Female",
    other: language === "es" ? "Otro" : "Other",
    unspecified: language === "es" ? "No especificado" : "Unspecified",
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true)
        const response = await patientsApi.getPatients()
        setPatients(response || [])
      } catch (error) {
        console.error("Error fetching patients:", error)
        setPatients([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeletePatient = async () => {
    if (patientToDelete !== null) {
      try {
        await patientsApi.deletePatient(patientToDelete)
        setPatients(patients.filter((patient) => patient.id !== patientToDelete))
        setPatientToDelete(null)
        setIsDeleteDialogOpen(false)
      } catch (error) {
        console.error("Error eliminando paciente:", error)
        alert("Error al eliminar el paciente. Por favor, inténtelo de nuevo.")
      }
    }
  }

  const getGenderText = (gender) => {
    switch (gender) {
      case "male":
        return t.male
      case "female":
        return t.female
      case "other":
        return t.other
      default:
        return t.unspecified
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Link href="/admin/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t.new}
          </Button>
        </Link>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t.search}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">{t.list}</TabsTrigger>
          <TabsTrigger value="cards">{t.cards}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="border-none p-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.dob}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {t.notFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          {patient.first_name} {patient.last_name}
                        </TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{new Date(patient.date_of_birth).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/patients/${patient.id}`}>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t.edit}</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setPatientToDelete(patient.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t.delete}</span>
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
            {filteredPatients.length === 0 ? (
              <p className="col-span-full text-center">{t.notFound}</p>
            ) : (
              filteredPatients.map((patient) => (
                <Card key={patient.id} className="overflow-hidden">
                  <div className="bg-primary p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-primary-foreground" />
                        <h3 className="text-lg font-semibold text-primary-foreground">
                          {patient.first_name} {patient.last_name}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{t.email}:</span>
                        <span className="text-sm">{patient.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{t.dob}:</span>
                        <span className="text-sm">{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{t.gender}:</span>
                        <span className="text-sm">{getGenderText(patient.gender)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Link href={`/admin/patients/${patient.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          {t.edit}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPatientToDelete(patient.id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.delete}
                      </Button>
                    </div>
                  </CardContent>
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
              ¿Está seguro de que desea eliminar este paciente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePatient}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
