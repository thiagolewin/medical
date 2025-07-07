"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LayoutDashboard, FileText, ClipboardList, Users, BarChart3, Plus, Eye, UserCog } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { authUtils } from "@/lib/auth"
import { formsApi, protocolsApi, patientsApi, usersApi } from "@/lib/api"

interface DashboardStats {
  forms: number
  protocols: number
  patients: number
  users: number
}

export default function AdminDashboard() {
  const { language } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    forms: 0,
    protocols: 0,
    patients: 0,
    users: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const isAdmin = authUtils.isAdmin()
  const canEdit = authUtils.canEdit()

  const t = {
    title: language === "es" ? "Panel de Control" : "Dashboard",
    welcome: language === "es" ? "Bienvenido" : "Welcome",
    loadingUser: language === "es" ? "Cargando información del usuario..." : "Loading user information...",
    overview: language === "es" ? "Resumen del Sistema" : "System Overview",
    quickActions: language === "es" ? "Acciones Rápidas" : "Quick Actions",
    recentActivity: language === "es" ? "Actividad Reciente" : "Recent Activity",
    forms: language === "es" ? "Formularios" : "Forms",
    protocols: language === "es" ? "Protocolos" : "Protocols",
    patients: language === "es" ? "Pacientes" : "Patients",
    users: language === "es" ? "Usuarios" : "Users",
    createForm: language === "es" ? "Crear Formulario" : "Create Form",
    createProtocol: language === "es" ? "Crear Protocolo" : "Create Protocol",
    addPatient: language === "es" ? "Agregar Paciente" : "Add Patient",
    addUser: language === "es" ? "Agregar Usuario" : "Add User",
    viewForms: language === "es" ? "Ver Formularios" : "View Forms",
    viewProtocols: language === "es" ? "Ver Protocolos" : "View Protocols",
    viewPatients: language === "es" ? "Ver Pacientes" : "View Patients",
    viewUsers: language === "es" ? "Ver Usuarios" : "View Users",
    dataAnalysis: language === "es" ? "Análisis de Datos" : "Data Analysis",
    viewAnalysis: language === "es" ? "Ver Análisis" : "View Analysis",
    totalForms: language === "es" ? "Total de Formularios" : "Total Forms",
    totalProtocols: language === "es" ? "Total de Protocolos" : "Total Protocols",
    totalPatients: language === "es" ? "Total de Pacientes" : "Total Patients",
    totalUsers: language === "es" ? "Total de Usuarios" : "Total Users",
    errorLoading: language === "es" ? "Error al cargar datos del dashboard" : "Error loading dashboard data",
    role: language === "es" ? "Rol" : "Role",
    admin: language === "es" ? "Administrador" : "Administrator",
    editor: language === "es" ? "Editor" : "Editor",
    viewer: language === "es" ? "Visualizador" : "Viewer",
  }

  useEffect(() => {
    const currentUser = authUtils.getUser()
    setUser(currentUser)
    setUserLoaded(true)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError("")

      const [formsData, protocolsData, patientsData, usersData] = await Promise.allSettled([
        formsApi.getForms(),
        protocolsApi.getProtocols(),
        patientsApi.getPatients(),
        isAdmin ? usersApi.getUsers() : Promise.resolve([]),
      ])

      setStats({
        forms: formsData.status === "fulfilled" ? formsData.value.length : 0,
        protocols: protocolsData.status === "fulfilled" ? protocolsData.value.length : 0,
        patients: patientsData.status === "fulfilled" ? patientsData.value.length : 0,
        users: usersData.status === "fulfilled" ? usersData.value.length : 0,
      })
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError(`${t.errorLoading}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "editor":
        return "default"
      case "viewer":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return t.admin
      case "editor":
        return t.editor
      case "viewer":
        return t.viewer
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            {t.title}
          </h1>
          <div className="mt-2">
            {!userLoaded ? (
              <p className="text-gray-600">{t.loadingUser}</p>
            ) : user ? (
              <div className="flex items-center gap-2">
                <p className="text-gray-600">
                  {t.welcome}, <span className="font-semibold">{user.username}</span>
                </p>
                <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleText(user.role)}</Badge>
              </div>
            ) : (
              <p className="text-gray-600">{t.welcome}</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalForms}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.forms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalProtocols}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.protocols}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalPatients}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.patients}</div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.users}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Forms Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t.forms}
              </h3>
              <div className="space-y-2">
                {isAdmin && (
                  <Link href="/admin/forms/new">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.createForm}
                    </Button>
                  </Link>
                )}
                <Link href="/admin/forms">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    {t.viewForms}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Protocols Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                {t.protocols}
              </h3>
              <div className="space-y-2">
                {isAdmin && (
                  <Link href="/admin/protocols/new">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.createProtocol}
                    </Button>
                  </Link>
                )}
                <Link href="/admin/protocols">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    {t.viewProtocols}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Patients Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.patients}
              </h3>
              <div className="space-y-2">
                {isAdmin && (
                  <Link href="/admin/patients/new">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addPatient}
                    </Button>
                  </Link>
                )}
                <Link href="/admin/patients">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    {t.viewPatients}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Users Actions - Solo para admins */}
            {isAdmin && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  {t.users}
                </h3>
                <div className="space-y-2">
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addUser}
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      {t.viewUsers}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Analysis Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {t.dataAnalysis}
              </h3>
              <div className="space-y-2">
                <Link href="/admin/analysis">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t.viewAnalysis}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
