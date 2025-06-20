"use client"

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardTitle } from "./card"

interface ErrorStateProps {
  error: Error
  onRetry?: () => void
  title?: string
  description?: string
  showRetry?: boolean
  className?: string
}

export function ErrorState({ error, onRetry, title, description, showRetry = true, className = "" }: ErrorStateProps) {
  const isNetworkError = error.name === "NetworkError" || error.message.includes("fetch")
  const isServerError = error.message.includes("500") || error.message.includes("503")

  const getIcon = () => {
    if (isNetworkError) return <WifiOff className="w-8 h-8 text-red-500" />
    return <AlertCircle className="w-8 h-8 text-red-500" />
  }

  const getTitle = () => {
    if (title) return title
    if (isNetworkError) return "Sin conexión"
    if (isServerError) return "Error del servidor"
    return "Error"
  }

  const getDescription = () => {
    if (description) return description
    if (isNetworkError) return "Verifica tu conexión a internet e intenta nuevamente"
    if (isServerError) return "El servidor está experimentando problemas. Intenta más tarde"
    return error.message || "Ha ocurrido un error inesperado"
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4">{getIcon()}</div>
        <CardTitle className="mb-2 text-lg">{getTitle()}</CardTitle>
        <CardDescription className="mb-4 max-w-sm">{getDescription()}</CardDescription>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Componente inline para errores pequeños
export function InlineError({
  error,
  onRetry,
  className = "",
}: {
  error: Error
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
        <span className="text-sm text-red-700">{error.message}</span>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="ghost" size="sm">
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}
