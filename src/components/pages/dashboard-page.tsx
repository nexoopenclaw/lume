"use client";

import { useState } from "react";
import { Kpi, Card } from "@/components/ui/primitives";
import { Kind, useFinanceStore } from "@/lib/finance-store";

export function DashboardPage() {
  const s = useFinanceStore();
  const [newTx, setNewTx] = useState({ accountId: "", categoryId: "", kind: "expense" as Kind, amount: "", currency: "USD", note: "", date: new Date().toISOString().slice(0, 10) });

  return <>
    <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold">Resumen financiero</h1>
    </header>
    <section className="grid gap-4 md:grid-cols-3">
      <Card title="Moneda base y tipo de cambio"><div className="grid grid-cols-2 gap-2"><select className="field" value={s.baseCurrency} onChange={(e)=>s.setBaseCurrency(e.target.value as "USD"|"UYU")}><option>USD</option><option>UYU</option></select><input className="field" type="number" value={s.usdUyuRate} onChange={(e)=>s.setUsdUyuRate(e.target.value)} /></div></Card>
      <Kpi title={`Ingresos (${s.baseCurrency})`} value={s.totals.income}/>
      <Kpi title={`Consumos (${s.baseCurrency})`} value={s.totals.expense}/>
    </section>
    <section className="mt-4 grid gap-4 md:grid-cols-4">
      <Kpi title={`Balance neto (${s.baseCurrency})`} value={s.accountBalances.selected} highlight/>
      <Kpi title="Balance USD" value={s.accountBalances.usd}/>
      <Kpi title="Balance UYU" value={s.accountBalances.uyu}/>
      <Kpi title="Presupuestos activos" value={s.budgets.length}/>
    </section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card title="Agregar movimiento rápido">
        <div className="space-y-2">
          <select className="field" value={newTx.kind} onChange={(e)=>setNewTx((x)=>({...x,kind:e.target.value as Kind}))}><option value="expense">Consumo</option><option value="income">Ingreso</option></select>
          <select className="field" value={newTx.accountId} onChange={(e)=>setNewTx((x)=>({...x,accountId:e.target.value}))}><option value="">Cuenta</option>{s.accounts.map((a)=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select className="field" value={newTx.categoryId} onChange={(e)=>setNewTx((x)=>({...x,categoryId:e.target.value}))}><option value="">Categoría</option>{s.categories.filter((c)=>c.kind==="both"||c.kind===newTx.kind).map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><input className="field" type="number" value={newTx.amount} onChange={(e)=>setNewTx((x)=>({...x,amount:e.target.value}))} placeholder="Monto"/><input className="field" value={newTx.currency} onChange={(e)=>setNewTx((x)=>({...x,currency:e.target.value}))} placeholder="Moneda"/></div>
          <input className="field" value={newTx.note} onChange={(e)=>setNewTx((x)=>({...x,note:e.target.value}))} placeholder="Nota"/>
          <button className="btn" onClick={()=>{s.addTx({ ...newTx, amount: Number(newTx.amount), currency:newTx.currency.toUpperCase() }); setNewTx((x)=>({...x,amount:"",note:""}));}}>Guardar movimiento</button>
        </div>
      </Card>
      <Card title="Alertas clave">
        <div className="space-y-2">{s.smartAlerts.map((a)=><div key={a.id} className="item block"><p className="font-medium">{a.title}</p><p className="text-sm text-zinc-300">{a.description}</p></div>)}{!s.smartAlerts.length&&<p className="text-sm text-zinc-400">Sin alertas por ahora.</p>}</div>
      </Card>
    </section>
  </>;
}
