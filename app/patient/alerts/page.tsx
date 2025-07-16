"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bell, Clock } from "lucide-react";
import { config } from "@/lib/config";
import { handleApiResponse } from "@/lib/api";

export default function PatientAlertsPage() {
  const [isSending, setIsSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [interval, setInterval] = useState<number | null>(null);
  const [loadingInterval, setLoadingInterval] = useState(true);

  // Obtener el intervalo actual al cargar
  useEffect(() => {
    const fetchInterval = async () => {
      setLoadingInterval(true);
      try {
        const res = await fetch(`${config.API_BASE_URL}/form-instances/interval`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await handleApiResponse(res);
        setInterval(data.interval);
      } catch (err) {
        setInterval(null);
      } finally {
        setLoadingInterval(false);
      }
    };
    fetchInterval();
  }, []);

  // Enviar alerta inmediata
  const handleSendAlert = async () => {
    setIsSending(true);
    setSendMsg(null);
    try {
      const res = await fetch(`${config.API_BASE_URL}/form-instances/callAlert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await handleApiResponse(res);
      setSendMsg("¡Alerta enviada correctamente!");
    } catch (err: any) {
      setSendMsg("Error al enviar alerta: " + (err?.message || ""));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Enviar alerta inmediata</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSendAlert} disabled={isSending} className="flex items-center gap-2">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Enviar alerta
          </Button>
          {sendMsg && <div className={`mt-4 ${sendMsg.startsWith("¡") ? "text-green-600" : "text-red-600"}`}>{sendMsg}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intervalo de alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            {loadingInterval ? (
              <span>Cargando intervalo...</span>
            ) : interval !== null ? (
              <span>El intervalo actual es de <b>{interval}</b> horas.</span>
            ) : (
              <span className="text-red-600">No se pudo obtener el intervalo.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 