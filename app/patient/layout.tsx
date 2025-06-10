"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, User, Bell, LogOut, Menu, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { patientAuthUtils } from "@/lib/patient-auth"

interface PatientLayoutProps {
  children: React.ReactNode
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)

    // Verificar autenticación del paciente
    if (!patientAuthUtils.isPatientAuthenticated()) {
      router.push("/patient/login")
    }
  }, [router])

  const handleLogout = () => {
    patientAuthUtils.clearPatientAuth()
    router.push("/patient/login")
  }

  if (!isMounted) {
    return null // Evitar renderizado en el servidor
  }

  const navigation = [
    { name: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { name: "Mis Protocolos", href: "/patient/protocols", icon: FileText },
    { name: "Mi Perfil", href: "/patient/profile", icon: User },
    { name: "Notificaciones", href: "/patient/notifications", icon: Bell },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar para pantallas grandes */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/patient/dashboard" className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Portal Paciente</span>
            </Link>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 flex-shrink-0 h-5 w-5",
                        isActive ? "text-blue-600 dark:text-blue-300" : "text-gray-400 dark:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
            <Button variant="ghost" className="flex items-center w-full" onClick={handleLogout}>
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar móvil */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Portal Paciente</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive ? "text-blue-600 dark:text-blue-300" : "text-gray-400 dark:text-gray-500",
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t p-4">
              <Button variant="ghost" className="flex items-center w-full" onClick={handleLogout}>
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                <span>Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Contenido principal */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
