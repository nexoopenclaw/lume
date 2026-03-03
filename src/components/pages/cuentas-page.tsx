"use client";
import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { fmt, useFinanceStore } from "@/lib/finance-store";

export function CuentasPage(){
  const s=useFinanceStore();
  const [name,setName]=useState(""); const [currency,setCurrency]=useState("USD"); const [balance,setBalance]=useState("0");
  return <Card title="Cuentas"><div className="grid grid-cols-3 gap-2"><input className="field" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nombre"/><input className="field" value={currency} onChange={(e)=>setCurrency(e.target.value)} placeholder="Moneda"/><input className="field" type="number" value={balance} onChange={(e)=>setBalance(e.target.value)} placeholder="Saldo"/></div><button className="btn mt-2" onClick={()=>{s.addAccount(name,currency,balance);setName("");setCurrency("USD");setBalance("0");}}>Agregar cuenta</button><div className="space-y-2 mt-3">{s.accounts.map((a)=><div key={a.id} className="item flex justify-between"><span>{a.name} ({a.currency})</span><span>{fmt(a.balance)}</span></div>)}</div></Card>
}
