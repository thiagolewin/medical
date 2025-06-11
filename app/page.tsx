"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, Shield, Clock, CheckCircle, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema Médico</h1>
                <p className="text-sm text-gray-600">Gestión de formularios y protocolos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Bienvenido al Sistema Médico</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plataforma integral para la gestión de formularios médicos, protocolos de tratamiento y seguimiento de
            pacientes.
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Personal Médico */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Personal Médico</CardTitle>
              <CardDescription className="text-gray-600">
                Acceso completo para administrar formularios, protocolos y pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Acceso administrativo completo</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Reportes y análisis</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span>Gestión de formularios</span>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3">
                  Acceder como Personal Médico
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Portal del Paciente */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Portal del Paciente</CardTitle>
              <CardDescription className="text-gray-600">
                Acceso seguro para completar formularios médicos asignados
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Formularios personalizados</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>Acceso 24/7</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Información segura</span>
                </div>
              </div>
              <Link href="/patient/login">
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3">
                  Acceder como Paciente
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Características del Sistema</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Seguridad</h4>
              <p className="text-gray-600">Protección de datos médicos con los más altos estándares de seguridad</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Eficiencia</h4>
              <p className="text-gray-600">Optimización de procesos médicos para un mejor seguimiento de pacientes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Análisis</h4>
              <p className="text-gray-600">Reportes detallados para mejorar la toma de decisiones médicas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2024 Sistema Médico. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
