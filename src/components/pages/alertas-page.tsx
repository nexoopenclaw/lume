"use client";
import { Card } from "@/components/ui/primitives";
import { useFinanceStore } from "@/lib/finance-store";

export function AlertasPage(){
  const s=useFinanceStore();
  return <Card title="Alertas inteligentes"><div className="space-y-2">{s.smartAlerts.map((a)=><div key={a.id} className="item block"><div className="flex justify-between"><p className="font-medium">{a.title}</p><span className={`badge ${a.severity==="critical"?"badge-critical":a.severity==="warn"?"badge-risk":"badge-info"}`}>{a.severity}</span></div><p className="text-sm text-zinc-300 mt-1">{a.description}</p></div>)}{!s.smartAlerts.length&&<p className="text-sm text-zinc-400">Sin alertas por ahora.</p>}</div></Card>
}
