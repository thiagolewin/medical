"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Activity, Clock, CheckCircle, AlertCircle, User } from "lucide-react"
import { patientAuthUtils } from "@/lib/patient-auth"

export default function PatientDashboard() {
  const [patient, setPatient] = useState<any>(null)
  const [protocols, setProtocols] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Obtener datos del paciente desde localStorage
        const patientData = patientAuthUtils.getPatient()
        setPatient(patientData)

        // Cargar protocolos y formularios (simulados por ahora)
        // En el futuro, estos vendrán de la API
        setProtocols([
          {
            id: 1,
            name: "Protocolo de Rehabilitación Cardíaca",
            status: "active",
            progress: 65,
            next_appointment: "2024-01-15",
          },
          {
            id: 2,
            name: "Seguimiento Post-Operatorio",
            status: "completed",
            progress: 100,
            next_appointment: null,
          },
        ])

        setForms([
          {
            id: 1,
            title: "Evaluación Diaria de Síntomas",
            status: "pending",
            due_date: "2024-01-12",
            protocol_name: "Protocolo de Rehabilitación Cardíaca",
          },
          {
            id: 2,
            title: "Cuestionario de Calidad de Vida",
            status: "completed",
            due_date: "2024-01-10",
            protocol_name: "Seguimiento Post-Operatorio",
          },
        ])
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando su información...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const activeProtocols = protocols.filter((p) => p.status === "active").length
  const completedProtocols = protocols.filter((p) => p.status === "completed").length
  const pendingForms = forms.filter((f) => f.status === "pending").length
  const completedForms = forms.filter((f) => f.status === "completed").length

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-red-100 p-3 rounded-full">
            <User className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {patient?.username || "Paciente"}</h1>
            <p className="text-gray-600">
              Aquí puede ver el resumen de sus protocolos médicos y formularios pendientes.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Activos</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProtocols}</div>
            <p className="text-xs text-gray-600">En seguimiento actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedProtocols}</div>
            <p className="text-xs text-gray-600">Finalizados exitosamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formularios Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingForms}</div>
            <p className="text-xs text-gray-600">Por completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formularios Completados</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{completedForms}</div>
            <p className="text-xs text-gray-600">Enviados correctamente</p>
          </CardContent>
        </Card>
      </div>

      {/* Protocolos activos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-red-600" />
            <span>Mis Protocolos Activos</span>
          </CardTitle>
          <CardDescription>Protocolos médicos que está siguiendo actualmente</CardDescription>
        </CardHeader>
        <CardContent>
          {protocols.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tiene protocolos asignados actualmente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {protocols.map((protocol) => (
                <div key={protocol.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{protocol.name}</h3>
                    {getStatusBadge(protocol.status)}
                  </div>
                  {protocol.status === "active" && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{protocol.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${protocol.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {protocol.next_appointment && (
                    <p className="text-sm text-gray-600">
                      Próxima cita: {new Date(protocol.next_appointment).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formularios pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span>Formularios Pendientes</span>
          </CardTitle>
          <CardDescription>Formularios que necesitan ser completados</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingForms === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">¡Excelente! No tiene formularios pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forms
                .filter((form) => form.status === "pending")
                .map((form) => (
                  <div key={form.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{form.title}</h3>
                      {getStatusBadge(form.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Protocolo: {form.protocol_name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Fecha límite: {new Date(form.due_date).toLocaleDateString()}
                      </p>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Completar Formulario
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
