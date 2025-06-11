"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Heart, Menu, FileText, LogOut } from "lucide-react"
import Link from "next/link"
import { patientAuthUtils } from "@/lib/patient-auth"

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ["/patient/login", "/patient/forgot-password", "/patient/support"]

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
      const isAuthenticated = patientAuthUtils.isPatientAuthenticated()
      const patientData = patientAuthUtils.getPatient()

      console.log("Patient Layout - Checking auth:", {
        pathname,
        isPublicRoute,
        isAuthenticated,
        patientData,
      })

      if (isPublicRoute) {
        // Si es una ruta pública, no necesita autenticación
        setIsLoading(false)
        if (pathname === "/patient" || pathname === "/patient/") {
          router.push("/patient/forms")
          return
        }
        return
      }

      if (!isAuthenticated) {
        // Si no está autenticado y no es ruta pública, redirigir al login
        console.log("Patient not authenticated, redirecting to login")
        router.push("/patient/login")
        return
      }

      // Si está autenticado, cargar datos del paciente
      setPatient(patientData)
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  const handleLogout = () => {
    patientAuthUtils.clearPatientAuth()
    router.push("/patient/login")
  }

  // Si es una ruta pública, mostrar solo el contenido sin sidebar
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // Si está cargando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay paciente autenticado, no mostrar nada (se redirigirá)
  if (!patient) {
    return null
  }

  const navigation = [{ name: "Mis Formularios", href: "/patient/forms", icon: FileText }]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 mb-8">
                    <Heart className="h-8 w-8 text-red-600" />
                    <span className="text-xl font-bold">Portal Paciente</span>
                  </div>
                  <nav className="flex-1">
                    <ul className="space-y-2">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              pathname === item.href
                                ? "bg-red-100 text-red-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="border-t pt-4">
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold hidden sm:block">Portal del Paciente</span>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{patient.username}</p>
              <p className="text-xs text-gray-500">{patient.email}</p>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:min-h-[calc(100vh-73px)]">
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-red-100 text-red-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
