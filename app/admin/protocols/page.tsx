"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, FileText, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { protocolsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { authUtils } from "@/lib/auth"

interface Protocol {
  id: number
  key_name: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  created_at: string
  updated_at: string
  form_count?: number
}

export default function ProtocolsPage() {
  const { language } = useLanguage()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingForms, setLoadingForms] = useState<Record<number, boolean>>({})

  const user = typeof window !== "undefined" ? authUtils.getUser() : null;
  const isViewer = user?.role === "viewer";

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        setIsLoading(true)
        const protocolsData = await protocolsApi.getProtocols()
        console.log("Protocolos cargados:", protocolsData)

        // Cargar el conteo de formularios para cada protocolo
        const protocolsWithFormCount = await Promise.all(
          protocolsData.map(async (protocol) => {
            try {
              setLoadingForms((prev) => ({ ...prev, [protocol.id]: true }))
              const forms = await protocolsApi.getProtocolForms(protocol.id)
              console.log(`Formularios para protocolo ${protocol.id}:`, forms)
              return {
                ...protocol,
                form_count: forms.length,
              }
            } catch (error) {
              console.error(`Error cargando formularios para protocolo ${protocol.id}:`, error)
              return {
                ...protocol,
                form_count: 0,
              }
            } finally {
              setLoadingForms((prev) => ({ ...prev, [protocol.id]: false }))
            }
          }),
        )

        setProtocols(protocolsWithFormCount)
        setFilteredProtocols(protocolsWithFormCount)
      } catch (error) {
        console.error("Error cargando protocolos:", error)
        setProtocols([])
        setFilteredProtocols([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProtocols()
  }, [])

  useEffect(() => {
    const filtered = protocols.filter(
      (protocol) =>
        protocol.name_es.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.key_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredProtocols(filtered)
  }, [searchTerm, protocols])

  const deleteProtocol = async (id: number) => {
    if (
      window.confirm(
        language === "es"
          ? "¿Está seguro de que desea eliminar este protocolo?"
          : "Are you sure you want to delete this protocol?",
      )
    ) {
      try {
        await protocolsApi.deleteProtocol(id)
        const updatedProtocols = protocols.filter((protocol) => protocol.id !== id)
        setProtocols(updatedProtocols)
        setFilteredProtocols(updatedProtocols)
      } catch (error) {
        console.error("Error eliminando protocolo:", error)
        alert(language === "es" ? "Error al eliminar el protocolo" : "Error deleting protocol")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">
            {language === "es" ? "Cargando protocolos..." : "Loading protocols..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{language === "es" ? "Protocolos" : "Protocols"}</h1>
          <p className="text-muted-foreground">
            {language === "es" ? "Gestione los protocolos médicos del sistema" : "Manage medical system protocols"}
          </p>
        </div>
        { !isViewer && <Link href="/admin/protocols/new"><Button>Nuevo protocolo</Button></Link> }
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={language === "es" ? "Buscar protocolos..." : "Search protocols..."}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredProtocols.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === "es" ? "No hay protocolos" : "No protocols found"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {language === "es"
                ? "No se encontraron protocolos. Cree uno nuevo para comenzar."
                : "No protocols found. Create a new one to get started."}
            </p>
            { !isViewer && <Link href="/admin/protocols/new"><Button>Crear primer protocolo</Button></Link> }
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{language === "es" ? protocol.name_es : protocol.name_en}</CardTitle>
                    <CardDescription className="text-sm">
                      {language === "es" ? protocol.description_es : protocol.description_en}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {protocol.key_name}
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {loadingForms[protocol.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span>
                        {protocol.form_count || 0} {language === "es" ? "formularios" : "forms"}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {language === "es" ? "Creado:" : "Created:"} {new Date(protocol.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    { !isViewer && <Link href={`/admin/protocols/${protocol.id}`}><Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button></Link> }
                    { !isViewer && <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProtocol(protocol.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button> }
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
