"use client";
import { Card } from "@/components/ui/primitives";
import { fmt, useFinanceStore } from "@/lib/finance-store";

export function TransaccionesPage(){
  const s=useFinanceStore();
  return <Card title="Transacciones"><div className="space-y-2"><input className="field" value={s.query} onChange={(e)=>s.setQuery(e.target.value)} placeholder="Buscar"/><div className="grid grid-cols-2 gap-2"><select className="field" value={s.fCategory} onChange={(e)=>s.setFCategory(e.target.value)}><option value="">Todas categorías</option>{s.categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="field" value={s.fAccount} onChange={(e)=>s.setFAccount(e.target.value)}><option value="">Todas cuentas</option>{s.accounts.map((a)=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div><div className="space-y-2 max-h-[560px] overflow-auto">{s.filteredTxs.map((t)=><div key={t.id} className="item block"><div className="flex justify-between"><div><p className="font-medium">{s.categoryMap[t.categoryId]?.name} • {s.accountMap[t.accountId]?.name}</p><p className="text-xs text-zinc-400">{t.date} {t.note?`• ${t.note}`:""}</p></div><span className={t.kind==="income"?"text-green-400":"text-red-400"}>{t.kind==="income"?"+":"-"}{fmt(t.amount)} {t.currency}</span></div><button className="btn btn-small btn-danger mt-2" onClick={()=>s.deleteTx(t.id)}>Eliminar</button></div>)}{!s.filteredTxs.length&&<p className="text-sm text-zinc-400">Sin resultados.</p>}</div></div></Card>
}
