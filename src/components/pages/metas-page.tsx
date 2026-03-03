"use client";
import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { fmt, useFinanceStore } from "@/lib/finance-store";

export function MetasPage(){
  const s=useFinanceStore();
  const [title,setTitle]=useState(""); const [type,setType]=useState<"income"|"savings">("income"); const [target,setTarget]=useState(""); const [currency,setCurrency]=useState<"USD"|"UYU">("USD"); const [deadline,setDeadline]=useState("");
  return <Card title="Metas financieras"><div className="space-y-2"><input className="field" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título"/><div className="grid grid-cols-2 gap-2"><select className="field" value={type} onChange={(e)=>setType(e.target.value as any)}><option value="income">Ingresos</option><option value="savings">Ahorro</option></select><select className="field" value={currency} onChange={(e)=>setCurrency(e.target.value as any)}><option>USD</option><option>UYU</option></select></div><div className="grid grid-cols-2 gap-2"><input className="field" type="number" value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Objetivo"/><input className="field" type="date" value={deadline} onChange={(e)=>setDeadline(e.target.value)} /></div><button className="btn" onClick={()=>{s.addGoal({title,type,target:Number(target),currency,deadline});setTitle("");setTarget("");setDeadline("");}}>Guardar meta</button><div className="space-y-2">{s.goals.map((g)=>{const p=s.goalProgress(g);return <div key={g.id} className="item block"><div className="flex justify-between"><span>{g.title}</span><span className="badge">{fmt(p.current)} / {fmt(g.target)} {g.currency}</span></div><div className="mt-2 h-2 rounded bg-white/10"><div className="h-2 rounded bg-[#d4e83a]" style={{width:`${p.pct}%`}} /></div></div>})}</div></div></Card>
}
