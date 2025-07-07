"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Download, RefreshCw } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { protocolsApi, analysisApi } from "@/lib/api"
import { authUtils } from "@/lib/auth"

interface Protocol {
  id: number
  name: string
  description: string
  forms?: Form[]
}

interface Form {
  id: number
  name: string
  description: string
}

interface AnalysisFilter {
  type: string
  field: string
  operator: string
  value: any
}

interface AnalysisResult {
  data: any[]
  summary: {
    total: number
    filtered: number
  }
}

export default function AnalysisPage() {
  const { language } = useLanguage()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<string>("")
  const [availableForms, setAvailableForms] = useState<Form[]>([])
  const [selectedForms, setSelectedForms] = useState<number[]>([])
  const [filters, setFilters] = useState<AnalysisFilter[]>([])
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProtocols, setLoadingProtocols] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const canViewData = authUtils.canViewData()

  const t = {
    title: language === "es" ? "Análisis de Datos" : "Data Analysis",
    subtitle:
      language === "es"
        ? "Analiza los datos recopilados de formularios y protocolos"
        : "Analyze data collected from forms and protocols",
    selectProtocol: language === "es" ? "Seleccionar Protocolo" : "Select Protocol",
    selectForms: language === "es" ? "Seleccionar Formularios" : "Select Forms",
    filters: language === "es" ? "Filtros" : "Filters",
    addFilter: language === "es" ? "Agregar Filtro" : "Add Filter",
    executeAnalysis: language === "es" ? "Ejecutar Análisis" : "Execute Analysis",
    exportResults: language === "es" ? "Exportar Resultados" : "Export Results",
    results: language === "es" ? "Resultados" : "Results",
    noProtocols: language === "es" ? "No hay protocolos disponibles" : "No protocols available",
    noForms:
      language === "es" ? "No hay formularios disponibles para este protocolo" : "No forms available for this protocol",
    selectProtocolFirst: language === "es" ? "Selecciona un protocolo primero" : "Select a protocol first",
    selectFormsFirst: language === "es" ? "Selecciona al menos un formulario" : "Select at least one form",
    loadingProtocols: language === "es" ? "Cargando protocolos..." : "Loading protocols...",
    loadingForms: language === "es" ? "Cargando formularios..." : "Loading forms...",
    executing: language === "es" ? "Ejecutando análisis..." : "Executing analysis...",
    errorLoadingProtocols: language === "es" ? "Error al cargar protocolos" : "Error loading protocols",
    errorLoadingForms: language === "es" ? "Error al cargar formularios" : "Error loading forms",
    errorExecutingAnalysis: language === "es" ? "Error al ejecutar análisis" : "Error executing analysis",
    analysisCompleted: language === "es" ? "Análisis completado exitosamente" : "Analysis completed successfully",
    totalRecords: language === "es" ? "Total de registros" : "Total records",
    filteredRecords: language === "es" ? "Registros filtrados" : "Filtered records",
    noResults: language === "es" ? "No se encontraron resultados" : "No results found",
    protocol: language === "es" ? "Protocolo" : "Protocol",
    form: language === "es" ? "Formulario" : "Form",
    allForms: language === "es" ? "Todos los formularios" : "All forms",
    refresh: language === "es" ? "Actualizar" : "Refresh",
    clear: language === "es" ? "Limpiar" : "Clear",
    summary: language === "es" ? "Resumen" : "Summary",
    data: language === "es" ? "Datos" : "Data",
  }

  useEffect(() => {
    loadProtocols()
  }, [])

  useEffect(() => {
    if (selectedProtocol) {
      loadProtocolForms(Number.parseInt(selectedProtocol))
    } else {
      setAvailableForms([])
      setSelectedForms([])
    }
  }, [selectedProtocol])

  const loadProtocols = async () => {
    try {
      setLoadingProtocols(true)
      setError("")
      console.log("=== Cargando protocolos ===")

      const data = await protocolsApi.getProtocols()
      console.log("Protocolos obtenidos:", data)

      // Asegurar que data es un array
      const protocolsArray = Array.isArray(data) ? data : []
      setProtocols(protocolsArray)

      if (protocolsArray.length === 0) {
        console.log("No se encontraron protocolos")
      }
    } catch (err) {
      console.error("Error cargando protocolos:", err)
      setError(`${t.errorLoadingProtocols}: ${err instanceof Error ? err.message : String(err)}`)
      setProtocols([]) // Asegurar que protocols sea un array vacío en caso de error
    } finally {
      setLoadingProtocols(false)
    }
  }

  const loadProtocolForms = async (protocolId: number) => {
    try {
      setLoading(true)
      setError("")
      console.log("=== Cargando formularios del protocolo ===", protocolId)

      const data = await protocolsApi.getProtocolForms(protocolId)
      console.log("Formularios del protocolo obtenidos:", data)

      // Transformar los datos si vienen en formato diferente
      let forms: Form[] = []
      if (Array.isArray(data)) {
        forms = data.map((item: any) => ({
          id: item.form_id || item.id,
          name: item.form_name || item.name || `Form ${item.form_id || item.id}`,
          description: item.form_description || item.description || "",
        }))
      } else if (data && typeof data === "object") {
        // Si data no es array pero es un objeto, intentar extraer forms
        const formsData = data.forms || data.data || []
        if (Array.isArray(formsData)) {
          forms = formsData.map((item: any) => ({
            id: item.form_id || item.id,
            name: item.form_name || item.name || `Form ${item.form_id || item.id}`,
            description: item.form_description || item.description || "",
          }))
        }
      }

      console.log("Formularios transformados:", forms)
      setAvailableForms(forms)
      setSelectedForms([])

      if (forms.length === 0) {
        console.log("No se encontraron formularios para este protocolo")
      }
    } catch (err) {
      console.error("Error cargando formularios del protocolo:", err)
      setError(`${t.errorLoadingForms}: ${err}`)
      setAvailableForms([])
    } finally {
      setLoading(false)
    }
  }

  const handleFormSelection = (formId: number, checked: boolean) => {
    if (checked) {
      setSelectedForms([...selectedForms, formId])
    } else {
      setSelectedForms(selectedForms.filter((id) => id !== formId))
    }
  }

  const handleSelectAllForms = (checked: boolean) => {
    if (checked) {
      setSelectedForms(availableForms.map((form) => form.id))
    } else {
      setSelectedForms([])
    }
  }

  const executeAnalysis = async () => {
    if (!selectedProtocol) {
      setError(t.selectProtocolFirst)
      return
    }

    if (selectedForms.length === 0) {
      setError(t.selectFormsFirst)
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")
      console.log("=== Ejecutando análisis ===")
      console.log("Protocolo seleccionado:", selectedProtocol)
      console.log("Formularios seleccionados:", selectedForms)
      console.log("Filtros:", filters)

      const payload = {
        filtros: filters.map((filter) => ({
          type: filter.type,
          field: filter.field,
          operator: filter.operator,
          value: filter.value,
        })),
        traer: selectedForms,
      }

      console.log("Payload del análisis:", payload)

      const data = await analysisApi.executeAnalysis(payload)
      console.log("Resultados del análisis:", data)

      setResults(data)
      setSuccess(t.analysisCompleted)
    } catch (err) {
      console.error("Error ejecutando análisis:", err)
      setError(`${t.errorExecutingAnalysis}: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const clearAnalysis = () => {
    setSelectedProtocol("")
    setAvailableForms([])
    setSelectedForms([])
    setFilters([])
    setResults(null)
    setError("")
    setSuccess("")
  }

  const exportResults = () => {
    if (!results) return

    const dataStr = JSON.stringify(results, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `analysis_results_${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (!canViewData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {language === "es" ? "Acceso Denegado" : "Access Denied"}
          </h1>
          <p className="text-gray-600">
            {language === "es"
              ? "No tienes permisos para ver esta página."
              : "You don't have permission to view this page."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            {t.title}
          </h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProtocols} disabled={loadingProtocols}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingProtocols ? "animate-spin" : ""}`} />
            {t.refresh}
          </Button>
          <Button variant="outline" onClick={clearAnalysis}>
            {t.clear}
          </Button>
        </div>
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

      {/* Protocol Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t.selectProtocol}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProtocols ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">{t.loadingProtocols}</span>
            </div>
          ) : protocols.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.noProtocols}</p>
            </div>
          ) : (
            <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectProtocol} />
              </SelectTrigger>
              <SelectContent>
                {protocols.map((protocol) => (
                  <SelectItem key={protocol.id} value={protocol.id.toString()}>
                    {protocol.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Forms Selection */}
      {selectedProtocol && (
        <Card>
          <CardHeader>
            <CardTitle>{t.selectForms}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">{t.loadingForms}</span>
              </div>
            ) : availableForms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t.noForms}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedForms.length === availableForms.length}
                    onCheckedChange={handleSelectAllForms}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    {t.allForms}
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableForms.map((form) => (
                    <div key={form.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={`form-${form.id}`}
                        checked={selectedForms.includes(form.id)}
                        onCheckedChange={(checked) => handleFormSelection(form.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <label htmlFor={`form-${form.id}`} className="text-sm font-medium cursor-pointer">
                          {form.name}
                        </label>
                        {form.description && <p className="text-xs text-gray-500 mt-1">{form.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedForms.length} / {availableForms.length} {language === "es" ? "seleccionados" : "selected"}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Execution */}
      {selectedForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.executeAnalysis}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={executeAnalysis} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t.executing}
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t.executeAnalysis}
                  </>
                )}
              </Button>
              {results && (
                <Button variant="outline" onClick={exportResults}>
                  <Download className="w-4 h-4 mr-2" />
                  {t.exportResults}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>{t.results}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900">{t.totalRecords}</h3>
                  <p className="text-2xl font-bold text-blue-700">{results.summary?.total || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900">{t.filteredRecords}</h3>
                  <p className="text-2xl font-bold text-green-700">{results.summary?.filtered || 0}</p>
                </div>
              </div>

              {/* Data Preview */}
              {results.data && results.data.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h3 className="font-semibold">{t.data}</h3>
                  </div>
                  <div className="p-4 max-h-96 overflow-auto">
                    <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(results.data.slice(0, 10), null, 2)}
                    </pre>
                    {results.data.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        {language === "es"
                          ? `Mostrando los primeros 10 de ${results.data.length} registros`
                          : `Showing first 10 of ${results.data.length} records`}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t.noResults}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
