"use client";
import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { monthLabel, fmt, useFinanceStore } from "@/lib/finance-store";

export function PresupuestosPage(){
  const s=useFinanceStore();
  const [cat,setCat]=useState(""); const [kind,setKind]=useState<"expense"|"income"|"both">("expense");
  const [budgetCat,setBudgetCat]=useState(""); const [limit,setLimit]=useState(""); const [currency,setCurrency]=useState<"USD"|"UYU">("USD");
  const monthNow=new Date().toISOString().slice(0,7);
  return <Card title={`Presupuestos • ${monthLabel(monthNow)}`}><div className="space-y-2"><div className="grid grid-cols-3 gap-2"><input className="field col-span-2" value={cat} onChange={(e)=>setCat(e.target.value)} placeholder="Nueva categoría"/><select className="field" value={kind} onChange={(e)=>setKind(e.target.value as any)}><option value="expense">Consumo</option><option value="income">Ingreso</option><option value="both">Ambos</option></select></div><button className="btn" onClick={()=>{s.addCategory(cat,kind);setCat("");}}>Agregar categoría</button><div className="grid grid-cols-3 gap-2"><select className="field" value={budgetCat} onChange={(e)=>setBudgetCat(e.target.value)}><option value="">Categoría</option>{s.categories.filter((c)=>c.kind!=="income").map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="field" type="number" value={limit} onChange={(e)=>setLimit(e.target.value)} placeholder="Límite"/><select className="field" value={currency} onChange={(e)=>setCurrency(e.target.value as any)}><option>USD</option><option>UYU</option></select></div><button className="btn" onClick={()=>{s.addBudget(budgetCat,limit,currency);setLimit("");}}>Guardar presupuesto</button><div className="space-y-2">{s.overBudgetItems.map((i)=><div key={i.categoryId} className="item flex justify-between"><span>{s.categoryMap[i.categoryId]?.name}</span><span className="text-red-300">+{fmt(i.excess)} {s.baseCurrency}</span></div>)}{!s.overBudgetItems.length&&<p className="text-sm text-zinc-400">Sin sobre-presupuestos.</p>}</div></div></Card>
}
