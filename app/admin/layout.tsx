"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, ClipboardList, Users, LogOut, Menu, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { authUtils } from "@/lib/auth"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/lib/language-context"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { language } = useLanguage()

  useEffect(() => {
    setIsMounted(true)

    // Verificar autenticación
    if (!authUtils.isAuthenticated()) {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    authUtils.clearAuth()
    router.push("/login")
  }

  if (!isMounted) {
    return null // Evitar renderizado en el servidor
  }

  const navigation = [
    {
      name: language === "es" ? "Dashboard" : "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: language === "es" ? "Formularios" : "Forms",
      href: "/admin/forms",
      icon: FileText,
    },
    {
      name: language === "es" ? "Protocolos" : "Protocols",
      href: "/admin/protocols",
      icon: ClipboardList,
    },
    {
      name: language === "es" ? "Pacientes" : "Patients",
      href: "/admin/patients",
      icon: Users,
    },
    {
      name: language === "es" ? "Análisis de Datos" : "Data Analysis",
      href: "/admin/analysis",
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar para pantallas grandes */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50">
        <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/admin/dashboard" className="flex items-center">
              <span className="text-xl font-bold">MediTrack</span>
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
                        ? "bg-gray-100 dark:bg-gray-800 text-primary"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 flex-shrink-0 h-5 w-5",
                        isActive ? "text-primary" : "text-gray-400 dark:text-gray-500",
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
              <span>{language === "es" ? "Cerrar sesión" : "Sign out"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar móvil */}
      <div className="md:hidden">
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40" onClick={() => setIsOpen(true)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">{language === "es" ? "Abrir menú" : "Open menu"}</span>
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
                <span className="text-xl font-bold">MediTrack</span>
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
                            ? "bg-gray-100 dark:bg-gray-800 text-primary"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 flex-shrink-0 h-5 w-5",
                            isActive ? "text-primary" : "text-gray-400 dark:text-gray-500",
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
                  <span>{language === "es" ? "Cerrar sesión" : "Sign out"}</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Contenido principal */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Header global */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="md:hidden w-12"></div> {/* Espacio para el botón de menú en móvil */}
                <h1 className="text-xl font-semibold text-gray-900">
                  {language === "es" ? "Panel de Administración" : "Administration Panel"}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
