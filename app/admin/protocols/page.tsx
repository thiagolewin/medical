"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { protocolsApi } from "@/lib/api"
import { ErrorState, InlineError } from "@/components/ui/error-state"
import { useErrorHandler } from "@/lib/error-handler"

export default function ProtocolsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [protocols, setProtocols] = useState([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [protocolToDelete, setProtocolToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [deleteError, setDeleteError] = useState<Error | null>(null)
  const { handleError } = useErrorHandler()

  const fetchProtocols = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await protocolsApi.getProtocols()
      setProtocols(response || [])
    } catch (err) {
      const { error: processedError } = handleError(err, "fetchProtocols")
      setError(processedError)
      setProtocols([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProtocols()
  }, [])

  const filteredProtocols = protocols.filter(
    (protocol) =>
      protocol.name_es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.key_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteProtocol = async () => {
    if (protocolToDelete !== null) {
      try {
        setDeleteError(null)
        await protocolsApi.deleteProtocol(protocolToDelete)
        setProtocols(protocols.filter((protocol) => protocol.id !== protocolToDelete))
        setProtocolToDelete(null)
        setIsDeleteDialogOpen(false)
      } catch (err) {
        const { error: processedError } = handleError(err, "deleteProtocol")
        setDeleteError(processedError)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando protocolos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState error={error} onRetry={fetchProtocols} title="Error al cargar protocolos" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Protocolos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestione los protocolos médicos del sistema</p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/admin/protocols/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Nuevo protocolo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Buscador responsive */}
      <div className="w-full">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar protocolos..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs responsive */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
          <TabsTrigger value="cards" className="text-xs sm:text-sm">
            Tarjetas
          </TabsTrigger>
          <TabsTrigger value="list" className="text-xs sm:text-sm">
            Lista
          </TabsTrigger>
        </TabsList>

        {/* Vista de tarjetas - por defecto en móvil */}
        <TabsContent value="cards" className="border-none p-0 mt-4">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProtocols.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No se encontraron protocolos</p>
              </div>
            ) : (
              filteredProtocols.map((protocol) => (
                <Card key={protocol.id} className="flex flex-col">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg line-clamp-2 min-w-0">{protocol.name_es}</CardTitle>
                      <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    <CardDescription className="line-clamp-2 text-sm">{protocol.key_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      <Badge variant="outline" className="w-fit">
                        {protocol.formCount || 0} formularios
                      </Badge>
                      <span className="text-muted-foreground text-xs sm:text-sm">
                        Creado: {new Date(protocol.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link href={`/admin/protocols/${protocol.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setProtocolToDelete(protocol.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vista de lista - mejor para desktop */}
        <TabsContent value="list" className="border-none p-0 mt-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nombre (ES)</TableHead>
                    <TableHead className="min-w-[150px] hidden sm:table-cell">Nombre (EN)</TableHead>
                    <TableHead className="min-w-[100px]">Clave</TableHead>
                    <TableHead className="min-w-[80px] text-center">Formularios</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">Creado</TableHead>
                    <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProtocols.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <ClipboardList className="h-8 w-8 text-gray-400 mb-2" />
                          <span>No se encontraron protocolos</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProtocols.map((protocol) => (
                      <TableRow key={protocol.id}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[200px]" title={protocol.name_es}>
                            {protocol.name_es}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="truncate max-w-[200px]" title={protocol.name_en}>
                            {protocol.name_en || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {protocol.key_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{protocol.formCount || 0}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {new Date(protocol.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/admin/protocols/${protocol.id}`}>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <Edit className="h-3 w-3" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setProtocolToDelete(protocol.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este protocolo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="my-2">
              <InlineError error={deleteError} onRetry={() => setDeleteError(null)} />
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteError(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProtocol} className="w-full sm:w-auto">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
