"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, Clock } from "lucide-react";
import { authUtils } from "@/lib/auth";
import { config } from "@/lib/config";
import { handleApiResponse } from "@/lib/api";

const BASE_URL = config.API_BASE_URL;

export default function AlertsPage() {
  const user = typeof window !== "undefined" ? authUtils.getUser() : null;
  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor";

  const [isSending, setIsSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [interval, setInterval] = useState<number>(6);
  const [isSavingInterval, setIsSavingInterval] = useState(false);
  const [intervalMsg, setIntervalMsg] = useState<string | null>(null);

  // Enviar alerta inmediata
  const handleSendAlert = async () => {
    setIsSending(true);
    setSendMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/form-instances/callAlert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      });
      await handleApiResponse(res);
      setSendMsg("¡Alerta enviada correctamente!");
    } catch (err: any) {
      setSendMsg("Error al enviar alerta: " + (err?.message || ""));
    } finally {
      setIsSending(false);
    }
  };

  // Cambiar intervalo de alertas
  const handleChangeInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInterval(true);
    setIntervalMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/form-instances/changeInterval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ interval }),
      });
      await handleApiResponse(res);
      setIntervalMsg("Intervalo actualizado correctamente.");
    } catch (err: any) {
      setIntervalMsg("Error al actualizar intervalo: " + (err?.message || ""));
    } finally {
      setIsSavingInterval(false);
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

      {(isAdmin || isEditor) && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar intervalo de alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeInterval} className="space-y-4">
              <div>
                <Label htmlFor="interval">Intervalo (horas)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="interval"
                    type="number"
                    min={1}
                    value={interval}
                    onChange={e => setInterval(Number(e.target.value))}
                    className="w-24"
                  />
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <Button type="submit" disabled={isSavingInterval}>
                {isSavingInterval ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar intervalo"}
              </Button>
              {intervalMsg && <div className={`mt-2 ${intervalMsg.startsWith("Intervalo") ? "text-green-600" : "text-red-600"}`}>{intervalMsg}</div>}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 