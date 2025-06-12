"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-700" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema Médico</h1>
          <p className="text-gray-600">Seleccione su tipo de acceso</p>
        </div>

        {/* User Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Personal Médico */}
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-gray-300">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>
              </div>
              <CardTitle className="text-xl text-gray-900">Personal Médico</CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Link href="/login">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Acceder</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Portal del Paciente */}
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-gray-300">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <FileText className="h-6 w-6 text-gray-700" />
                </div>
              </div>
              <CardTitle className="text-xl text-gray-900">Portal del Paciente</CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Link href="/patient/login">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                  Acceder
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">© 2024 Sistema Médico</p>
        </div>
      </div>
    </div>
  )
}
