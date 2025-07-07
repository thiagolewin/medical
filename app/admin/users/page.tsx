"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCog, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { usersApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"

interface User {
  id: number
  username: string
  email: string
  role: "admin" | "editor" | "viewer"
  created_at?: string
  updated_at?: string
}

interface UserFormData {
  username: string
  email: string
  password: string
  role: string
}

export default function UsersPage() {
  const { language } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    role: "viewer",
  })

  const t = {
    title: language === "es" ? "Gestión de Usuarios" : "User Management",
    subtitle: language === "es" ? "Administra los usuarios del sistema" : "Manage system users",
    createUser: language === "es" ? "Crear Usuario" : "Create User",
    editUser: language === "es" ? "Editar Usuario" : "Edit User",
    username: language === "es" ? "Nombre de usuario" : "Username",
    email: language === "es" ? "Correo electrónico" : "Email",
    password: language === "es" ? "Contraseña" : "Password",
    role: language === "es" ? "Rol" : "Role",
    actions: language === "es" ? "Acciones" : "Actions",
    admin: language === "es" ? "Administrador" : "Admin",
    editor: language === "es" ? "Editor" : "Editor",
    viewer: language === "es" ? "Visualizador" : "Viewer",
    save: language === "es" ? "Guardar" : "Save",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    edit: language === "es" ? "Editar" : "Edit",
    delete: language === "es" ? "Eliminar" : "Delete",
    confirmDelete:
      language === "es" ? "¿Estás seguro de eliminar este usuario?" : "Are you sure you want to delete this user?",
    loading: language === "es" ? "Cargando..." : "Loading...",
    noUsers: language === "es" ? "No hay usuarios registrados" : "No users registered",
    errorLoading: language === "es" ? "Error al cargar usuarios" : "Error loading users",
    errorCreating: language === "es" ? "Error al crear usuario" : "Error creating user",
    errorUpdating: language === "es" ? "Error al actualizar usuario" : "Error updating user",
    errorDeleting: language === "es" ? "Error al eliminar usuario" : "Error deleting user",
    userCreated: language === "es" ? "Usuario creado exitosamente" : "User created successfully",
    userUpdated: language === "es" ? "Usuario actualizado exitosamente" : "User updated successfully",
    userDeleted: language === "es" ? "Usuario eliminado exitosamente" : "User deleted successfully",
    showPassword: language === "es" ? "Mostrar contraseña" : "Show password",
    hidePassword: language === "es" ? "Ocultar contraseña" : "Hide password",
    enterUsername: language === "es" ? "Ingrese nombre de usuario" : "Enter username",
    enterEmail: language === "es" ? "Ingrese correo electrónico" : "Enter email",
    enterPassword: language === "es" ? "Ingrese contraseña" : "Enter password",
    selectRole: language === "es" ? "Seleccionar rol" : "Select role",
    creating: language === "es" ? "Creando..." : "Creating...",
    updating: language === "es" ? "Actualizando..." : "Updating...",
    deleting: language === "es" ? "Eliminando..." : "Deleting...",
  }

  const isAdmin = authUtils.isAdmin()

  useEffect(() => {
    if (!isAdmin) {
      setError(
        language === "es"
          ? "No tienes permisos para acceder a esta sección"
          : "You don't have permission to access this section",
      )
      return
    }
    loadUsers()
  }, [isAdmin, language])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await usersApi.getUsers()
      setUsers(data)
    } catch (err) {
      setError(`${t.errorLoading}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      if (!formData.username || !formData.email || !formData.password) {
        setError(language === "es" ? "Todos los campos son obligatorios" : "All fields are required")
        return
      }

      await usersApi.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      setSuccess(t.userCreated)
      setIsCreateDialogOpen(false)
      setFormData({ username: "", email: "", password: "", role: "viewer" })
      await loadUsers()
    } catch (err) {
      setError(`${t.errorCreating}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      if (!formData.username || !formData.email) {
        setError(language === "es" ? "Nombre de usuario y email son obligatorios" : "Username and email are required")
        return
      }

      await usersApi.updateUser(editingUser.id, {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      })

      setSuccess(t.userUpdated)
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFormData({ username: "", email: "", password: "", role: "viewer" })
      await loadUsers()
    } catch (err) {
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
      setError(`${t.errorDeleting}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "editor":
        return "default"
      case "viewer":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
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

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {language === "es"
              ? "No tienes permisos para acceder a esta sección"
              : "You don't have permission to access this section"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="w-8 h-8" />
            {t.title}
          </h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t.createUser}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.createUser}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">{t.username}</Label>
                <Input
                  id="username"
                  placeholder={t.enterUsername}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.enterEmail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.enterPassword}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? t.hidePassword : t.showPassword}</span>
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="role">{t.role}</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectRole} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                    <SelectItem value="editor">{t.editor}</SelectItem>
                    <SelectItem value="viewer">{t.viewer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={handleCreateUser} disabled={loading}>
                  {loading ? t.creating : t.save}
                </Button>
              </div>
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>{language === "es" ? "Lista de Usuarios" : "User List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">{t.loading}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.noUsers}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t.username}</TableHead>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.role}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleText(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
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
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editUser}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">{t.username}</Label>
              <Input
                id="edit-username"
                placeholder={t.enterUsername}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">{t.email}</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder={t.enterEmail}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">{t.role}</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                  <SelectItem value="editor">{t.editor}</SelectItem>
                  <SelectItem value="viewer">{t.viewer}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleEditUser} disabled={loading}>
                {loading ? t.updating : t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
