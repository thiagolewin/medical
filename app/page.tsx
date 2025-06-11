"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Heart, Activity } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-900 p-4 rounded-full">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MediTrack</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema integral de seguimiento médico de pacientes. Seleccione su tipo de acceso para continuar.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Medical Staff Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-gray-300">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-900 p-4 rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Personal Médico</CardTitle>
              <CardDescription className="text-gray-600">Acceso completo al sistema administrativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Gestión de pacientes y protocolos
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Creación y edición de formularios
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Dashboard administrativo completo
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Reportes y estadísticas
                </li>
              </ul>
              <Link href="/login" className="block">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  Acceder como Personal Médico
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Patient Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-gray-300">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-red-600 p-4 rounded-full">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Portal del Paciente</CardTitle>
              <CardDescription className="text-gray-600">Acceso seguro a su información médica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Ver sus protocolos asignados
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Completar formularios médicos
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Seguimiento de su progreso
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Comunicación con su equipo médico
                </li>
              </ul>
              <Link href="/patient/login" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Acceder como Paciente</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">© 2024 MediTrack. Sistema de seguimiento médico seguro y confiable.</p>
          <p className="text-xs text-gray-400 mt-2">Para soporte técnico, contacte al administrador del sistema.</p>
        </div>
      </div>
    </div>
  )
}
