"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, FileText, HelpCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { formsApi, questionsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { authUtils } from "@/lib/auth"
import { config } from "@/lib/config";

interface Form {
  id: number
  key_name: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  created_at: string
  updated_at: string
  question_count?: number
}

export default function FormsPage() {
  const { language } = useLanguage()
  const [forms, setForms] = useState<Form[]>([])
  const [filteredForms, setFilteredForms] = useState<Form[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState<Record<number, boolean>>({})

  // --- Nueva sección: Enviar Query SQL ---
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string>("");
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryError("");
    setQueryResult(null);
    setIsQueryLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/forms/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ sql: query }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const data = await response.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryError(err.message || "Error al enviar la consulta");
    } finally {
      setIsQueryLoading(false);
    }
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true)
        const formsData = await formsApi.getForms()
        console.log("Formularios cargados:", formsData)

        // Cargar el conteo de preguntas para cada formulario
        const formsWithQuestionCount = await Promise.all(
          formsData.map(async (form) => {
            try {
              setLoadingQuestions((prev) => ({ ...prev, [form.id]: true }))
              const questions = await questionsApi.getQuestionsByForm(form.id)
              console.log(`Preguntas para formulario ${form.id}:`, questions)
              return {
                ...form,
                question_count: questions.length,
              }
            } catch (error) {
              console.error(`Error cargando preguntas para formulario ${form.id}:`, error)
              return {
                ...form,
                question_count: 0,
              }
            } finally {
              setLoadingQuestions((prev) => ({ ...prev, [form.id]: false }))
            }
          }),
        )

        setForms(formsWithQuestionCount)
        setFilteredForms(formsWithQuestionCount)
      } catch (error) {
        console.error("Error cargando formularios:", error)
        setForms([])
        setFilteredForms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [])

  useEffect(() => {
    const filtered = forms.filter(
      (form) =>
        form.name_es.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.key_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredForms(filtered)
  }, [searchTerm, forms])

  const deleteForm = async (id: number) => {
    if (
      window.confirm(
        language === "es"
          ? "¿Está seguro de que desea eliminar este formulario?"
          : "Are you sure you want to delete this form?",
      )
    ) {
      try {
        await formsApi.deleteForm(id)
        const updatedForms = forms.filter((form) => form.id !== id)
        setForms(updatedForms)
        setFilteredForms(updatedForms)
      } catch (error) {
        console.error("Error eliminando formulario:", error)
        alert(language === "es" ? "Error al eliminar el formulario" : "Error deleting form")
      }
    }
  }

  const user = typeof window !== "undefined" ? authUtils.getUser() : null;
  const isViewer = user?.role === "viewer";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">{language === "es" ? "Cargando formularios..." : "Loading forms..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{language === "es" ? "Formularios" : "Forms"}</h1>
          <p className="text-muted-foreground">
            {language === "es" ? "Gestione los formularios del sistema médico" : "Manage medical system forms"}
          </p>
        </div>
        { !isViewer && <Link href="/admin/forms/new"><Button>Nuevo formulario</Button></Link> }
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={language === "es" ? "Buscar formularios..." : "Search forms..."}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === "es" ? "No hay formularios" : "No forms found"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {language === "es"
                ? "No se encontraron formularios. Cree uno nuevo para comenzar."
                : "No forms found. Create a new one to get started."}
            </p>
            { !isViewer && <Link href="/admin/forms/new"><Button>Crear primer formulario</Button></Link> }
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{language === "es" ? form.name_es : form.name_en}</CardTitle>
                    <CardDescription className="text-sm">
                      {language === "es" ? form.description_es : form.description_en}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {form.key_name}
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <HelpCircle className="h-3 w-3" />
                    {loadingQuestions[form.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span>
                        {form.question_count || 0} {language === "es" ? "preguntas" : "questions"}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {language === "es" ? "Creado:" : "Created:"} {new Date(form.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    { !isViewer && <Link href={`/admin/forms/${form.id}`}><Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button></Link> }
                    { !isViewer && <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteForm(form.id)}
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

      {/* Nueva sección: Enviar Query SQL */}
      <section style={{ marginTop: 32, marginBottom: 32, padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Enviar Query SQL</h2>
        <form onSubmit={handleQuerySubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Escribe tu consulta SQL aquí..."
            rows={4}
            style={{ fontFamily: "monospace", fontSize: 16, padding: 8 }}
            required
          />
          <button type="submit" disabled={isQueryLoading} style={{ padding: "8px 16px", fontWeight: 600 }}>
            {isQueryLoading ? "Enviando..." : "Enviar Query"}
          </button>
        </form>
        {queryError && <div style={{ color: "red", marginTop: 8 }}>Error: {queryError}</div>}
        {queryResult && (
          <pre style={{ marginTop: 16, background: "#f8f8f8", padding: 12, borderRadius: 4, maxHeight: 300, overflow: "auto" }}>
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        )}
      </section>
    </div>
  )
}
