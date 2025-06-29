"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <Card className="w-full max-w-md mx-auto mt-8">
    <CardHeader className="text-center">
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <CardTitle className="text-red-900">¡Algo salió mal!</CardTitle>
      <CardDescription>Ha ocurrido un error inesperado. Puedes intentar recargar la página.</CardDescription>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <details className="text-left">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">Ver detalles del error</summary>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{error.message}</pre>
      </details>
      <Button onClick={retry} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Intentar nuevamente
      </Button>
    </CardContent>
  </Card>
)
