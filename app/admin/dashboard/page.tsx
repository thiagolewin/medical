"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ClipboardList, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formsApi, protocolsApi, patientsApi } from "@/lib/api"

interface User {
  id: number
  name: string
  role: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [recentForms, setRecentForms] = useState([])
  const [recentProtocols, setRecentProtocols] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [stats, setStats] = useState({
    totalForms: 0,
    totalProtocols: 0,
    totalPatients: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario
    try {
      const storedUser = localStorage.getItem("meditrack_user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser({
          id: parsedUser.id,
          name: parsedUser.username || parsedUser.name,
          role: parsedUser.role,
        })
      }
    } catch (error) {
      console.error("Error cargando usuario:", error)
    }

    // Cargar datos del dashboard
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)

    // Cargar formularios recientes
    try {
      console.log("Iniciando carga de formularios...")
      const forms = await formsApi.getForms()
      console.log("Formularios cargados:", forms)
      setRecentForms(forms.slice(0, 5))
      setStats((prev) => ({ ...prev, totalForms: forms.length }))
    } catch (error) {
      console.error("Error cargando formularios:", error)
      setRecentForms([])
    }

    // Cargar protocolos recientes
    try {
      console.log("Iniciando carga de protocolos...")
      const protocols = await protocolsApi.getProtocols()
      console.log("Protocolos cargados:", protocols)
      setRecentProtocols(protocols.slice(0, 5))
      setStats((prev) => ({ ...prev, totalProtocols: protocols.length }))
    } catch (error) {
      console.error("Error cargando protocolos:", error)
      setRecentProtocols([])
    }

    // Cargar pacientes recientes
    try {
      console.log("Iniciando carga de pacientes...")
      const patients = await patientsApi.getPatients()
      console.log("Pacientes cargados:", patients)
      setRecentPatients(patients.slice(0, 5))
      setStats((prev) => ({ ...prev, totalPatients: patients.length }))
    } catch (error) {
      console.error("Error cargando pacientes:", error)
      setRecentPatients([])
    }

    setIsLoading(false)
  }

  // Si no hay usuario, mostrar un mensaje de carga pero no bloquear la interfaz
  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Cargando información de usuario...</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Cargando datos del usuario...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido, {user.name}. Aquí tienes un resumen del sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formularios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">Formularios configurados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">Protocolos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Pacientes registrados</p>
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
        <div className="grid gap-6 md:grid-cols-3">
          {/* Formularios recientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formularios recientes</CardTitle>
                <CardDescription>Últimos formularios creados</CardDescription>
              </div>
              <Link href="/admin/forms/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentForms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay formularios recientes</p>
                ) : (
                  recentForms.map((form) => (
                    <div key={form.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{form.name_es}</p>
                        <p className="text-xs text-muted-foreground">{form.key_name}</p>
                      </div>
                      <Link href={`/admin/forms/${form.id}`}>
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

          {/* Protocolos recientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Protocolos recientes</CardTitle>
                <CardDescription>Últimos protocolos creados</CardDescription>
              </div>
              <Link href="/admin/protocols/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentProtocols.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay protocolos recientes</p>
                ) : (
                  recentProtocols.map((protocol) => (
                    <div key={protocol.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{protocol.name_es}</p>
                        <p className="text-xs text-muted-foreground">{protocol.key_name}</p>
                      </div>
                      <Link href={`/admin/protocols/${protocol.id}`}>
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

          {/* Pacientes recientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pacientes recientes</CardTitle>
                <CardDescription>Últimos pacientes registrados</CardDescription>
              </div>
              <Link href="/admin/patients/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay pacientes recientes</p>
                ) : (
                  recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.email}</p>
                      </div>
                      <Link href={`/admin/patients/${patient.id}`}>
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
        </div>
      )}
    </div>
  )
}
