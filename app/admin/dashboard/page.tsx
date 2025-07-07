"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ClipboardList, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formsApi, protocolsApi, patientsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { authUtils } from "@/lib/auth"

interface User {
  id: number
  name: string
  role: string
  username: string
}

export default function DashboardPage() {
  const { language } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [stats, setStats] = useState({
    totalForms: 0,
    totalProtocols: 0,
    totalPatients: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const t = {
    dashboard: language === "es" ? "Dashboard" : "Dashboard",
    welcome: language === "es" ? "Bienvenido" : "Welcome",
    loadingUserInfo: language === "es" ? "Cargando información de usuario..." : "Loading user information...",
    forms: language === "es" ? "Formularios" : "Forms",
    protocols: language === "es" ? "Protocolos" : "Protocols",
    patients: language === "es" ? "Pacientes" : "Patients",
    configuredForms: language === "es" ? "Formularios configurados" : "Configured forms",
    activeProtocols: language === "es" ? "Protocolos activos" : "Active protocols",
    registeredPatients: language === "es" ? "Pacientes registrados" : "Registered patients",
    viewAll: language === "es" ? "Ver todos" : "View all",
    quickActions: language === "es" ? "Acciones rápidas" : "Quick actions",
    createNewItems: language === "es" ? "Crear nuevos elementos" : "Create new items",
    newForm: language === "es" ? "Nuevo Formulario" : "New Form",
    newProtocol: language === "es" ? "Nuevo Protocolo" : "New Protocol",
    newPatient: language === "es" ? "Nuevo Paciente" : "New Patient",
    loadingData: language === "es" ? "Cargando datos..." : "Loading data...",
    retry: language === "es" ? "Reintentar" : "Retry",
  }

  useEffect(() => {
    // Cargar usuario
    try {
      const storedUser = authUtils.getUser()
      console.log("Usuario almacenado:", storedUser)
      if (storedUser) {
        setUser({
          id: storedUser.id,
          name: storedUser.username || storedUser.name || "Usuario",
          role: storedUser.role,
          username: storedUser.username,
        })
        console.log("Usuario cargado:", storedUser)
      }
    } catch (error) {
      console.error("Error cargando usuario:", error)
    } finally {
      setUserLoaded(true)
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
      setError(language === "es" ? "Error cargando los datos del dashboard" : "Error loading dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const canModifyData = authUtils.canModifyData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.dashboard}</h1>
        <p className="text-muted-foreground">
          {userLoaded
            ? user
              ? `${t.welcome}, ${user.name}`
              : language === "es"
                ? "Usuario no identificado"
                : "User not identified"
            : t.loadingUserInfo}
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadDashboardData} className="mt-2 bg-transparent" variant="outline">
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.forms}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">{t.configuredForms}</p>
            <Link href="/admin/forms" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                {t.viewAll}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.protocols}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">{t.activeProtocols}</p>
            <Link href="/admin/protocols" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                {t.viewAll}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.patients}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">{t.registeredPatients}</p>
            <Link href="/admin/patients" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                {t.viewAll}
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
              <span className="ml-2">{t.loadingData}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && canModifyData && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.quickActions}
                <Plus className="h-4 w-4" />
              </CardTitle>
              <CardDescription>{t.createNewItems}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/forms/new" className="block">
                <Button className="w-full bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  {t.newForm}
                </Button>
              </Link>
              <Link href="/admin/protocols/new" className="block">
                <Button className="w-full bg-transparent" variant="outline">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {t.newProtocol}
                </Button>
              </Link>
              <Link href="/admin/patients/new" className="block">
                <Button className="w-full bg-transparent" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  {t.newPatient}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
