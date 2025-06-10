"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir al login de administrador por defecto
    router.push("/login")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">MediTrack</h1>
        <p className="text-gray-600 mb-8">Sistema de Seguimiento Médico</p>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              Acceso Personal Médico
            </button>
          </div>
          <div>
            <button
              onClick={() => router.push("/patient/login")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Portal del Paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
