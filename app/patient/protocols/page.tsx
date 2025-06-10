"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { patientProtocolApi } from "@/lib/patient-api"

export default function PatientProtocolsPage() {
  const [protocols, setProtocols] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        setIsLoading(true)
        const response = await patientProtocolApi.getMyProtocols()
        setProtocols(response || [])
      } catch (error) {
        console.error("Error fetching protocols:", error)
        setProtocols([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProtocols()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando protocolos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Protocolos</h1>
        <p className="text-muted-foreground">Protocolos médicos asignados a su tratamiento</p>
      </div>

      {protocols.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay protocolos asignados</h3>
            <p className="text-muted-foreground text-center">
              Actualmente no tiene protocolos médicos asignados. Contacte con su médico si cree que esto es un error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{protocol.protocol_name}</CardTitle>
                  {getStatusBadge(protocol.status)}
                </div>
                <CardDescription>{protocol.protocol_description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Iniciado: {new Date(protocol.start_date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>{protocol.total_forms || 0} formularios</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{protocol.completed_forms || 0} completados</span>
                </div>

                {protocol.pending_forms > 0 && (
                  <div className="flex items-center text-sm text-orange-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{protocol.pending_forms} pendientes</span>
                  </div>
                )}

                <div className="pt-4">
                  <Link href={`/patient/protocols/${protocol.id}`}>
                    <Button className="w-full">Ver Detalles</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
