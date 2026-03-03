"use client";

import { ChangeEvent } from "react";
import { Card } from "@/components/ui/primitives";
import { useFinanceStore } from "@/lib/finance-store";

export function ConfigPage() {
  const s = useFinanceStore();

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        s.importBackupText(String(reader.result || "{}"));
      } catch {
        alert("Backup inválido. Verifica que sea un JSON exportado desde Lume.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card title="Configuración y cloud sync">
      <div className="space-y-2">
        <button className="btn" onClick={s.exportBackup}>Exportar backup JSON</button>
        <label className="btn text-center cursor-pointer">
          Importar backup JSON
          <input className="hidden" type="file" accept="application/json" onChange={importBackup} />
        </label>

        <div className="grid md:grid-cols-4 gap-2">
          <input
            className="field md:col-span-2"
            placeholder="tu-email@dominio.com"
            value={s.cloudEmail}
            onChange={(e) => s.setCloudEmail(e.target.value)}
          />
          <button className="btn" onClick={s.sendCloudCode}>Enviar código</button>
          <input
            className="field"
            placeholder="Código de 6 dígitos"
            value={s.cloudCode}
            onChange={(e) => s.setCloudCode(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-2">
          <button className="btn" onClick={s.verifyCloudCode}>Verificar e ingresar</button>
          <button className="btn" onClick={s.saveCloud}>Guardar en cloud</button>
          <button className="btn" onClick={s.loadCloud}>Cargar desde cloud</button>
        </div>

        {s.cloudUserId ? <button className="btn" onClick={s.signOutCloud}>Cerrar sesión</button> : null}
        <p className="text-xs text-zinc-300">{s.cloudStatus}</p>
        {s.cloudUserId && <p className="text-xs text-zinc-400">user_id: {s.cloudUserId}</p>}
      </div>
    </Card>
  );
}
