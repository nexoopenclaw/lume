"use client";
import { Card } from "@/components/ui/primitives";
import { fmt, useFinanceStore } from "@/lib/finance-store";

export function ConciliacionPage(){
  const s=useFinanceStore();
  return <Card title="Conciliación de cuentas"><div className="space-y-2">{s.accounts.map((a)=>{const row=s.reconciliations[a.id]??{expectedBalance:String(a.balance),realBalance:""};const diff=Number(row.realBalance||0)-Number(row.expectedBalance||0);const ok=Math.abs(diff)<0.01;return <div key={a.id} className="item block"><div className="flex justify-between"><p>{a.name} ({a.currency})</p><span className={`badge ${ok?"badge-ok":"badge-risk"}`}>{ok?"ok":"descuadre"}</span></div><div className="grid grid-cols-2 gap-2 mt-2"><input className="field" type="number" value={row.expectedBalance} onChange={(e)=>s.updateReconciliation(a.id,"expectedBalance",e.target.value)} /><input className="field" type="number" value={row.realBalance} onChange={(e)=>s.updateReconciliation(a.id,"realBalance",e.target.value)} /></div><div className="mt-2 flex justify-between"><span>Diferencia: <b>{fmt(diff)} {a.currency}</b></span><button className="btn btn-small" onClick={()=>s.markAccountReconciled(a.id)}>Marcar</button></div></div>})}</div></Card>
}
