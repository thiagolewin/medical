"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { config } from "@/lib/config";
import { authUtils } from "@/lib/auth";
import { handleApiResponse } from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

interface UserForm extends User {
  password?: string;
}

const emptyUser: Partial<UserForm> = {
  username: "",
  email: "",
  password: "",
  role: "editor",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formUser, setFormUser] = useState<Partial<UserForm>>(emptyUser);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentUser(authUtils.getUser());
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${config.API_BASE_URL}/users`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await handleApiResponse(res);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormUser({ ...formUser, [e.target.name]: e.target.value });
  };

  const handleCreate = () => {
    setFormUser(emptyUser);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setFormUser(user);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que desea eliminar este usuario?")) return;
    try {
      setActionLoadingId(id);
      const res = await fetch(`${config.API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error("Error al eliminar usuario");
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err.message || "Error al eliminar usuario");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActionLoadingId(formUser.id || 0);
    try {
      if (isEditing && formUser.id) {
        // Editar usuario
        const { username, email, role } = formUser;
        const res = await fetch(`${config.API_BASE_URL}/users/${formUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ username, email, role }),
        });
        if (!res.ok) throw new Error("Error al editar usuario");
        setUsers(users.map((u) => (u.id === formUser.id ? { ...u, username, email, role } : u)));
      } else {
        // Crear usuario
        const { username, email, password, role } = formUser;
        const res = await fetch(`${config.API_BASE_URL}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ username, email, password, role }),
        });
        if (!res.ok) throw new Error("Error al crear usuario");
        const newUser = await res.json();
        setUsers([...users, newUser.data]);
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar usuario");
    } finally {
      setActionLoadingId(null);
    }
  };

  const canEdit = currentUser?.role === "admin";
  const canDelete = currentUser?.role === "admin";
  const canCreate = currentUser?.role === "admin" || currentUser?.role === "editor";
  const canView = true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo usuario
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Usuario</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Rol</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">{user.id}</td>
                      <td className="p-2">{user.username}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.role}</td>
                      <td className="p-2 space-x-2">
                        {canEdit && (
                          <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{isEditing ? "Editar usuario" : "Nuevo usuario"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  name="username"
                  value={formUser.username || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formUser.email || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {!isEditing && (
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formUser.password || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  name="role"
                  value={formUser.role || "editor"}
                  onChange={handleInputChange}
                  required
                  disabled={currentUser?.role !== "admin"}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || actionLoadingId === formUser.id}>
                  {isEditing ? "Guardar cambios" : "Crear usuario"}
                </Button>
              </div>
              {error && <div className="text-red-600 mt-2">{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
