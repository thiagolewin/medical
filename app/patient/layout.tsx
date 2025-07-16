"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { patientAuthUtils } from "@/lib/patient-auth"
import { LanguageProvider } from "@/lib/language-context"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/lib/language-context"

interface PatientLayoutProps {
  children: React.ReactNode
}

function PatientLayoutContent({ children }: PatientLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { language } = useLanguage()

  useEffect(() => {
    setIsMounted(true)

    // Verificar autenticación del paciente
    const checkAuth = () => {
      const authenticated = patientAuthUtils.isPatientAuthenticated()

      setIsAuthenticated(authenticated)
      setIsLoading(false)

      if (!authenticated) {
        router.push("/patient/login")
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    patientAuthUtils.clearPatientAuth()
    router.push("/patient/login")
  }

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar el layout completo
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del paciente */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {language === "es" ? "Portal del Paciente" : "Patient Portal"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{language === "es" ? "Cerrar sesión" : "Sign out"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <LanguageProvider>
      <PatientLayoutContent>{children}</PatientLayoutContent>
    </LanguageProvider>
  )
}
