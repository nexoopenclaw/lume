"use client";

import { useEffect, useMemo, useState } from "react";

type Kind = "expense" | "income";

type Category = {
  id: string;
  name: string;
  kind: Kind | "both";
};

type Account = {
  id: string;
  name: string;
  currency: string;
  balance: number;
};

type Tx = {
  id: string;
  accountId: string;
  categoryId: string;
  kind: Kind;
  amount: number;
  currency: string;
  note: string;
  date: string;
};

const BRAND = "#d4e83a";

const seedCategories: Category[] = [
  { id: "c-food", name: "Comida", kind: "expense" },
  { id: "c-ads", name: "Ads", kind: "expense" },
  { id: "c-tools", name: "Herramientas", kind: "expense" },
  { id: "c-client", name: "Clientes", kind: "income" },
  { id: "c-aff", name: "Afiliados", kind: "income" },
];

const seedAccounts: Account[] = [
  { id: "a-brou", name: "BROU", currency: "UYU", balance: 0 },
  { id: "a-itau", name: "Itaú", currency: "USD", balance: 0 },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function Home() {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [txs, setTxs] = useState<Tx[]>([]);

  const [newCat, setNewCat] = useState({ name: "", kind: "expense" as Category["kind"] });
  const [newAccount, setNewAccount] = useState({ name: "", currency: "USD", balance: "0" });
  const [newTx, setNewTx] = useState({
    accountId: "",
    categoryId: "",
    kind: "expense" as Kind,
    amount: "",
    currency: "USD",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const raw = localStorage.getItem("lume-v1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.accounts) setAccounts(parsed.accounts);
      if (parsed.txs) setTxs(parsed.txs);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("lume-v1", JSON.stringify({ categories, accounts, txs }));
  }, [categories, accounts, txs]);

  const totals = useMemo(() => {
    const income = txs.filter((t) => t.kind === "income").reduce((a, b) => a + b.amount, 0);
    const expense = txs.filter((t) => t.kind === "expense").reduce((a, b) => a + b.amount, 0);
    return { income, expense, net: income - expense };
  }, [txs]);

  const addCategory = () => {
    if (!newCat.name.trim()) return;
    setCategories((prev) => [...prev, { id: `c-${uid()}`, name: newCat.name.trim(), kind: newCat.kind }]);
    setNewCat({ name: "", kind: "expense" });
  };

  const addAccount = () => {
    if (!newAccount.name.trim()) return;
    setAccounts((prev) => [
      ...prev,
      {
        id: `a-${uid()}`,
        name: newAccount.name.trim(),
        currency: newAccount.currency.toUpperCase(),
        balance: Number(newAccount.balance || 0),
      },
    ]);
    setNewAccount({ name: "", currency: "USD", balance: "0" });
  };

  const addTx = () => {
    if (!newTx.accountId || !newTx.categoryId || !newTx.amount) return;
    const amount = Number(newTx.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const tx: Tx = {
      id: `t-${uid()}`,
      accountId: newTx.accountId,
      categoryId: newTx.categoryId,
      kind: newTx.kind,
      amount,
      currency: newTx.currency.toUpperCase(),
      note: newTx.note.trim(),
      date: newTx.date,
    };

    setTxs((prev) => [tx, ...prev]);
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== tx.accountId) return a;
        return { ...a, balance: a.balance + (tx.kind === "income" ? tx.amount : -tx.amount) };
      }),
    );

    setNewTx((s) => ({ ...s, amount: "", note: "" }));
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  return (
    <main className="min-h-screen bg-[#0b1018] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Lume</p>
          <h1 className="mt-2 text-3xl font-bold">Control de Finanzas Personal</h1>
          <p className="mt-2 text-sm text-zinc-400">Consumos, ingresos, cuentas y categorías en una vista simple. Acento de marca activo.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Kpi title="Ingresos" value={totals.income} />
          <Kpi title="Consumos" value={totals.expense} />
          <Kpi title="Balance Neto" value={totals.net} highlight />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card title="Agregar movimiento">
            <div className="space-y-2">
              <select className="field" value={newTx.kind} onChange={(e) => setNewTx((s) => ({ ...s, kind: e.target.value as Kind }))}>
                <option value="expense">Consumo</option>
                <option value="income">Ingreso</option>
              </select>
              <select className="field" value={newTx.accountId} onChange={(e) => setNewTx((s) => ({ ...s, accountId: e.target.value }))}>
                <option value="">Cuenta</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select className="field" value={newTx.categoryId} onChange={(e) => setNewTx((s) => ({ ...s, categoryId: e.target.value }))}>
                <option value="">Categoría</option>
                {categories.filter((c) => c.kind === "both" || c.kind === newTx.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input className="field" placeholder="Monto" type="number" value={newTx.amount} onChange={(e) => setNewTx((s) => ({ ...s, amount: e.target.value }))} />
                <input className="field" placeholder="Moneda" value={newTx.currency} onChange={(e) => setNewTx((s) => ({ ...s, currency: e.target.value }))} />
              </div>
              <input className="field" placeholder="Nota" value={newTx.note} onChange={(e) => setNewTx((s) => ({ ...s, note: e.target.value }))} />
              <input className="field" type="date" value={newTx.date} onChange={(e) => setNewTx((s) => ({ ...s, date: e.target.value }))} />
              <button className="btn" onClick={addTx}>Guardar movimiento</button>
            </div>
          </Card>

          <Card title="Cuentas bancarias">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input className="field" placeholder="Nombre" value={newAccount.name} onChange={(e) => setNewAccount((s) => ({ ...s, name: e.target.value }))} />
                <input className="field" placeholder="Moneda" value={newAccount.currency} onChange={(e) => setNewAccount((s) => ({ ...s, currency: e.target.value }))} />
                <input className="field" placeholder="Saldo" type="number" value={newAccount.balance} onChange={(e) => setNewAccount((s) => ({ ...s, balance: e.target.value }))} />
              </div>
              <button className="btn" onClick={addAccount}>Agregar cuenta</button>
              <div className="space-y-2 pt-2">
                {accounts.map((a) => (
                  <div key={a.id} className="item">
                    <span>{a.name} ({a.currency})</span>
                    <span className="font-semibold">{a.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Categorías">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input className="field col-span-2" placeholder="Nombre categoría" value={newCat.name} onChange={(e) => setNewCat((s) => ({ ...s, name: e.target.value }))} />
                <select className="field" value={newCat.kind} onChange={(e) => setNewCat((s) => ({ ...s, kind: e.target.value as Category["kind"] }))}>
                  <option value="expense">Consumo</option>
                  <option value="income">Ingreso</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              <button className="btn" onClick={addCategory}>Agregar categoría</button>
              <div className="space-y-2 pt-2">
                {categories.map((c) => (
                  <div key={c.id} className="item">
                    <span>{c.name}</span>
                    <span className="badge">{c.kind}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <Card title="Últimos movimientos">
            <div className="space-y-2">
              {txs.slice(0, 12).map((t) => (
                <div key={t.id} className="item">
                  <div>
                    <p className="font-medium">{categoryMap[t.categoryId]?.name ?? "Sin categoría"} • {accountMap[t.accountId]?.name ?? "Sin cuenta"}</p>
                    <p className="text-xs text-zinc-400">{t.date} {t.note ? `• ${t.note}` : ""}</p>
                  </div>
                  <span className={t.kind === "income" ? "text-green-400" : "text-red-400"}>
                    {t.kind === "income" ? "+" : "-"}{t.amount.toFixed(2)} {t.currency}
                  </span>
                </div>
              ))}
              {txs.length === 0 ? <p className="text-sm text-zinc-400">Sin movimientos todavía.</p> : null}
            </div>
          </Card>
        </section>
      </div>

      <style jsx global>{`
        .field {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          padding: 10px 12px;
          color: white;
          font-size: 14px;
        }
        .btn {
          width: 100%;
          border-radius: 10px;
          padding: 10px 12px;
          font-weight: 600;
          background: rgba(212,232,58,0.18);
          border: 1px solid rgba(212,232,58,0.45);
          color: #f4f7de;
          box-shadow: 0 0 16px rgba(212,232,58,0.18);
        }
        .item {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          padding: 10px 12px;
        }
        .badge {
          border: 1px solid rgba(212,232,58,0.45);
          background: rgba(212,232,58,0.12);
          color: ${BRAND};
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
        }
      `}</style>
    </main>
  );
}

function Kpi({ title, value, highlight = false }: { title: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-[#d4e83a]/45 bg-[#d4e83a]/10" : "border-white/10 bg-white/5"}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${highlight ? "text-[#d4e83a]" : "text-zinc-400"}`}>{title}</p>
      <p className="mt-2 text-3xl font-bold">{value.toFixed(2)}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#d4e83a]">{title}</h2>
      {children}
    </section>
  );
}
