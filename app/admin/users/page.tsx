"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Search, Edit, Trash2, UserPlus, Shield } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { usersApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"

interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const { language } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  // Create user dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "viewer",
  })

  // Edit user dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "",
  })

  const isAdmin = authUtils.isAdmin()

  const t = {
    title: language === "es" ? "Gestión de Usuarios" : "Users Management",
    subtitle: language === "es" ? "Administra los usuarios del sistema" : "Manage system users",
    createUser: language === "es" ? "Crear Usuario" : "Create User",
    editUser: language === "es" ? "Editar Usuario" : "Edit User",
    searchPlaceholder: language === "es" ? "Buscar usuarios..." : "Search users...",
    username: language === "es" ? "Nombre de Usuario" : "Username",
    email: language === "es" ? "Email" : "Email",
    password: language === "es" ? "Contraseña" : "Password",
    role: language === "es" ? "Rol" : "Role",
    createdAt: language === "es" ? "Fecha de Creación" : "Created At",
    actions: language === "es" ? "Acciones" : "Actions",
    edit: language === "es" ? "Editar" : "Edit",
    delete: language === "es" ? "Eliminar" : "Delete",
    save: language === "es" ? "Guardar" : "Save",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    create: language === "es" ? "Crear" : "Create",
    admin: language === "es" ? "Administrador" : "Admin",
    editor: language === "es" ? "Editor" : "Editor",
    viewer: language === "es" ? "Visualizador" : "Viewer",
    loading: language === "es" ? "Cargando usuarios..." : "Loading users...",
    noUsers: language === "es" ? "No hay usuarios registrados" : "No users registered",
    errorLoading: language === "es" ? "Error al cargar usuarios" : "Error loading users",
    errorCreating: language === "es" ? "Error al crear usuario" : "Error creating user",
    errorUpdating: language === "es" ? "Error al actualizar usuario" : "Error updating user",
    errorDeleting: language === "es" ? "Error al eliminar usuario" : "Error deleting user",
    userCreated: language === "es" ? "Usuario creado exitosamente" : "User created successfully",
    userUpdated: language === "es" ? "Usuario actualizado exitosamente" : "User updated successfully",
    userDeleted: language === "es" ? "Usuario eliminado exitosamente" : "User deleted successfully",
    confirmDelete:
      language === "es" ? "¿Estás seguro de eliminar este usuario?" : "Are you sure you want to delete this user?",
    noPermission:
      language === "es"
        ? "No tienes permisos para realizar esta acción"
        : "You don't have permission to perform this action",
    fillAllFields: language === "es" ? "Por favor completa todos los campos" : "Please fill all fields",
    invalidEmail: language === "es" ? "Por favor ingresa un email válido" : "Please enter a valid email",
    createUserTitle: language === "es" ? "Crear Nuevo Usuario" : "Create New User",
    createUserDescription: language === "es" ? "Ingresa los datos del nuevo usuario" : "Enter the new user data",
    editUserTitle: language === "es" ? "Editar Usuario" : "Edit User",
    editUserDescription: language === "es" ? "Modifica los datos del usuario" : "Modify user data",
  }

  useEffect(() => {
    if (!isAdmin) {
      setError(t.noPermission)
      return
    }
    loadUsers()
  }, [isAdmin])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await usersApi.getUsers()
      setUsers(data || [])
    } catch (err) {
      console.error("Error loading users:", err)
      setError(`${t.errorLoading}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email || !createForm.password || !createForm.role) {
      setError(t.fillAllFields)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(createForm.email)) {
      setError(t.invalidEmail)
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await usersApi.createUser(createForm)
      setSuccess(t.userCreated)
      setShowCreateDialog(false)
      setCreateForm({ username: "", email: "", password: "", role: "viewer" })
      await loadUsers()
    } catch (err) {
      console.error("Error creating user:", err)
      setError(`${t.errorCreating}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
    })
    setShowEditDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!editForm.username || !editForm.email || !editForm.role || !editingUser) {
      setError(t.fillAllFields)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.email)) {
      setError(t.invalidEmail)
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await usersApi.updateUser(editingUser.id, editForm)
      setSuccess(t.userUpdated)
      setShowEditDialog(false)
      setEditingUser(null)
      setEditForm({ username: "", email: "", role: "" })
      await loadUsers()
    } catch (err) {
      console.error("Error updating user:", err)
      setError(`${t.errorUpdating}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t.confirmDelete)) return

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await usersApi.deleteUser(userId)
      setSuccess(t.userDeleted)
      await loadUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(`${t.errorDeleting}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "default"
      case "editor":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleText = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return t.admin
      case "editor":
        return t.editor
      case "viewer":
        return t.viewer
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString(language === "es" ? "es-ES" : "en-US")
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>{t.noPermission}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            {t.title}
          </h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              {t.createUser}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.createUserTitle}</DialogTitle>
              <DialogDescription>{t.createUserDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-username">{t.username}</Label>
                <Input
                  id="create-username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder={t.username}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">{t.email}</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder={t.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">{t.password}</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder={t.password}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">{t.role}</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.role} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                    <SelectItem value="editor">{t.editor}</SelectItem>
                    <SelectItem value="viewer">{t.viewer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleCreateUser} disabled={loading}>
                {t.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Lista de Usuarios" : "Users List"} ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">{t.loading}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t.noUsers}</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t.createUser}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{t.username}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.role}</TableHead>
                    <TableHead>{t.createdAt}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleText(user.role)}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editUserTitle}</DialogTitle>
            <DialogDescription>{t.editUserDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">{t.username}</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder={t.username}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t.email}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder={t.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">{t.role}</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.role} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                  <SelectItem value="editor">{t.editor}</SelectItem>
                  <SelectItem value="viewer">{t.viewer}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
