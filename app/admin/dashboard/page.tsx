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
  const [stats, setStats] = useState({
    totalForms: 0,
    totalProtocols: 0,
    totalPatients: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cargar usuario
    try {
      const storedUser = localStorage.getItem("meditrack_user")
      console.log("Usuario almacenado:", storedUser)
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser({
          id: parsedUser.id,
          name: parsedUser.username || parsedUser.name,
          role: parsedUser.role,
        })
        console.log("Usuario cargado:", parsedUser)
      }
    } catch (error) {
      console.error("Error cargando usuario:", error)
    }

    // Cargar datos del dashboard
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("=== INICIANDO CARGA DE DATOS DEL DASHBOARD ===")

      // Cargar formularios
      try {
        console.log("Cargando formularios...")
        const forms = await formsApi.getForms()
        console.log("✅ Formularios cargados:", forms.length)
        setStats((prev) => ({ ...prev, totalForms: forms.length }))
      } catch (error) {
        console.error("❌ Error cargando formularios:", error)
        setStats((prev) => ({ ...prev, totalForms: 0 }))
      }

      // Cargar protocolos
      try {
        console.log("Cargando protocolos...")
        const protocols = await protocolsApi.getProtocols()
        console.log("✅ Protocolos cargados:", protocols.length)
        setStats((prev) => ({ ...prev, totalProtocols: protocols.length }))
      } catch (error) {
        console.error("❌ Error cargando protocolos:", error)
        setStats((prev) => ({ ...prev, totalProtocols: 0 }))
      }

      // Cargar pacientes
      try {
        console.log("Cargando pacientes...")
        const patients = await patientsApi.getPatients()
        console.log("✅ Pacientes cargados:", patients.length)
        setStats((prev) => ({ ...prev, totalPatients: patients.length }))
      } catch (error) {
        console.error("❌ Error cargando pacientes:", error)
        setStats((prev) => ({ ...prev, totalPatients: 0 }))
      }

      console.log("=== DATOS DEL DASHBOARD CARGADOS ===")
      console.log("Stats finales:", stats)
    } catch (error) {
      console.error("❌ Error general cargando dashboard:", error)
      setError("Error cargando los datos del dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {user ? `Bienvenido, ${user.name}` : "Cargando información de usuario..."}
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadDashboardData} className="mt-2" variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formularios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">Formularios configurados</p>
            <Link href="/admin/forms" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                Ver todos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">Protocolos activos</p>
            <Link href="/admin/protocols" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                Ver todos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Pacientes registrados</p>
            <Link href="/admin/patients" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                Ver todos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Cargando datos...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Acciones rápidas
                <Plus className="h-4 w-4" />
              </CardTitle>
              <CardDescription>Crear nuevos elementos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/forms/new" className="block">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Nuevo Formulario
                </Button>
              </Link>
              <Link href="/admin/protocols/new" className="block">
                <Button className="w-full" variant="outline">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Nuevo Protocolo
                </Button>
              </Link>
              <Link href="/admin/patients/new" className="block">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Nuevo Paciente
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
