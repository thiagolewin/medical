"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { patientAuthUtils } from "@/lib/patient-auth"
import { patientProtocolApi, patientFormApi } from "@/lib/patient-api"

export default function PatientDashboardPage() {
  const [patient, setPatient] = useState(null)
  const [protocols, setProtocols] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState({
    totalProtocols: 0,
    pendingForms: 0,
    completedForms: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar datos del paciente
    const patientData = patientAuthUtils.getPatient()
    setPatient(patientData)

    // Cargar datos del dashboard
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)

    try {
      // Cargar protocolos del paciente
      const protocolsData = await patientProtocolApi.getMyProtocols()
      setProtocols(protocolsData || [])

      // Cargar envíos del paciente
      const submissionsData = await patientFormApi.getMySubmissions()
      setSubmissions(submissionsData || [])

      // Calcular estadísticas
      setStats({
        totalProtocols: (protocolsData || []).length,
        pendingForms: 0, // Se calculará según la lógica del backend
        completedForms: (submissionsData || []).length,
      })
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Cargando información del paciente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {patient.first_name} {patient.last_name}
        </h1>
        <p className="text-muted-foreground">Aquí puede ver el resumen de su seguimiento médico.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">Protocolos asignados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formularios Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.pendingForms}</div>
            <p className="text-xs text-muted-foreground">Por completar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formularios Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.completedForms}</div>
            <p className="text-xs text-muted-foreground">Enviados exitosamente</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Cargando datos...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Protocolos activos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mis Protocolos</CardTitle>
                <CardDescription>Protocolos médicos asignados</CardDescription>
              </div>
              <Link href="/patient/protocols">
                <Button size="sm">Ver todos</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protocols.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tiene protocolos asignados</p>
                ) : (
                  protocols.slice(0, 3).map((protocol) => (
                    <div key={protocol.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{protocol.protocol_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Iniciado: {new Date(protocol.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/patient/protocols/${protocol.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimos formularios enviados</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                ) : (
                  submissions.slice(0, 3).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{submission.form_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviado: {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/patient/protocols">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>Ver Protocolos</span>
              </Button>
            </Link>
            <Link href="/patient/profile">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Mi Perfil</span>
              </Button>
            </Link>
            <Link href="/patient/notifications">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <AlertCircle className="h-6 w-6 mb-2" />
                <span>Notificaciones</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
