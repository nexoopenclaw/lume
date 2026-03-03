"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFinanceStore } from "@/lib/finance-store";

const nav = [
  ["/", "Resumen"],
  ["/cuentas", "Cuentas"],
  ["/transacciones", "Transacciones"],
  ["/presupuestos", "Presupuestos"],
  ["/metas", "Metas"],
  ["/conciliacion", "Conciliación"],
  ["/alertas", "Alertas"],
  ["/config", "Config"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { cloudEmail, setCloudEmail, cloudStatus, connectCloud, authChecked, cloudUserId } = useFinanceStore();

  if (authChecked && !cloudUserId) {
    return (
      <main className="min-h-screen bg-[#0b1018] text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Lume</p>
          <h1 className="mt-2 text-2xl font-bold">Ingresá para ver tus finanzas</h1>
          <p className="mt-2 text-sm text-zinc-400">Por privacidad, la app queda bloqueada hasta iniciar sesión.</p>
          <input className="field mt-4" placeholder="tu-email@dominio.com" value={cloudEmail} onChange={(e) => setCloudEmail(e.target.value)} />
          <button className="btn mt-3" onClick={connectCloud}>Enviar magic link</button>
          <p className="mt-3 text-xs text-zinc-400">{cloudStatus}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1018] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="grid md:grid-cols-[240px_1fr] gap-6">
          <aside className="hidden md:block rounded-2xl border border-white/10 bg-white/5 p-4 h-fit sticky top-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Lume</p>
            <nav className="mt-4 space-y-1">{nav.map(([href, label]) => <Link key={href} href={href} className={`block px-3 py-2 rounded-lg text-sm ${path===href?"bg-[#d4e83a]/20 text-[#d4e83a]":"text-zinc-300 hover:bg-white/5"}`}>{label}</Link>)}</nav>
          </aside>
          <section>{children}</section>
        </div>
      </div>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0b1018]/95 backdrop-blur p-2 flex gap-1 overflow-x-auto">{nav.map(([href, label]) => <Link key={href} href={href} className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap ${path===href?"bg-[#d4e83a]/20 text-[#d4e83a]":"text-zinc-300"}`}>{label}</Link>)}</nav>
    </main>
  );
}
