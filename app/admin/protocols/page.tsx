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

export default function ProtocolsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [protocols, setProtocols] = useState([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [protocolToDelete, setProtocolToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        setIsLoading(true)
        const response = await protocolsApi.getProtocols()
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

  const filteredProtocols = protocols.filter(
    (protocol) =>
      protocol.name_es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.key_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteProtocol = async () => {
    if (protocolToDelete !== null) {
      try {
        await protocolsApi.deleteProtocol(protocolToDelete)
        setProtocols(protocols.filter((protocol) => protocol.id !== protocolToDelete))
        setProtocolToDelete(null)
        setIsDeleteDialogOpen(false)
      } catch (error) {
        console.error("Error eliminando protocolo:", error)
        alert("Error al eliminar el protocolo. Por favor, inténtelo de nuevo.")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando protocolos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocolos</h1>
          <p className="text-muted-foreground">Gestione los protocolos médicos del sistema</p>
        </div>
        <Link href="/admin/protocols/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo protocolo
          </Button>
        </Link>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar protocolos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="cards">Tarjetas</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="border-none p-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre (ES)</TableHead>
                    <TableHead>Nombre (EN)</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Formularios</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProtocols.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No se encontraron protocolos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProtocols.map((protocol) => (
                      <TableRow key={protocol.id}>
                        <TableCell>{protocol.name_es}</TableCell>
                        <TableCell>{protocol.name_en}</TableCell>
                        <TableCell>{protocol.key_name}</TableCell>
                        <TableCell>{protocol.formCount || 0}</TableCell>
                        <TableCell>{new Date(protocol.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/protocols/${protocol.id}`}>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setProtocolToDelete(protocol.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cards" className="border-none p-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProtocols.length === 0 ? (
              <p className="col-span-full text-center">No se encontraron protocolos</p>
            ) : (
              filteredProtocols.map((protocol) => (
                <Card key={protocol.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{protocol.name_es}</CardTitle>
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{protocol.key_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{protocol.formCount || 0} formularios</Badge>
                      <span className="text-muted-foreground">
                        Creado: {new Date(protocol.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/admin/protocols/${protocol.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
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
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este protocolo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProtocol}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
