import { fmt } from "@/lib/finance-store";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
      <h2 className="mb-3 text-sm font-semibold text-[#d4e83a] tracking-[0.12em] uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function Kpi({ title, value, highlight = false }: { title: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-[#d4e83a]/45 bg-[#d4e83a]/10" : "border-white/10 bg-white/5"}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${highlight ? "text-[#d4e83a]" : "text-zinc-400"}`}>{title}</p>
      <p className="mt-2 text-3xl font-bold">{fmt(value)}</p>
    </div>
  );
}
