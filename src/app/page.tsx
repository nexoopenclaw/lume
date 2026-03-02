"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Kind = "expense" | "income";
type BaseCurrency = "USD" | "UYU";
type GoalType = "income" | "savings";

type Category = { id: string; name: string; kind: Kind | "both" };
type Account = { id: string; name: string; currency: string; balance: number };
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
type Budget = { categoryId: string; limit: number; currency: BaseCurrency };
type RecurringTx = {
  id: string;
  accountId: string;
  categoryId: string;
  kind: Kind;
  amount: number;
  currency: string;
  dayOfMonth: number;
  note: string;
  active: boolean;
  lastAppliedMonth?: string;
};
type FinancialGoal = {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  currency: BaseCurrency;
  deadline: string;
};

type TxDraft = {
  accountId: string;
  categoryId: string;
  kind: Kind;
  amount: string;
  currency: string;
  note: string;
  date: string;
};

const BRAND = "#d4e83a";
const STORAGE_KEY = "lume-v6";

const seedCategories: Category[] = [
  { id: "c-food", name: "Comida", kind: "expense" },
  { id: "c-ads", name: "Ads", kind: "expense" },
  { id: "c-tools", name: "Herramientas", kind: "expense" },
  { id: "c-vet", name: "Veterinaria", kind: "expense" },
  { id: "c-client", name: "Clientes", kind: "income" },
  { id: "c-aff", name: "Afiliados", kind: "income" },
  { id: "c-transfer", name: "Transferencias", kind: "both" },
];

const seedAccounts: Account[] = [
  { id: "a-brou", name: "BROU", currency: "UYU", balance: 0 },
  { id: "a-mi-usd", name: "Mi Dinero USD", currency: "USD", balance: 201.31 },
  { id: "a-mi-uyu", name: "Mi Dinero Pesos", currency: "UYU", balance: 0 },
  { id: "a-redots", name: "RedotPay", currency: "USDT", balance: 0 },
  { id: "a-binance", name: "Binance", currency: "USDT", balance: 905.5 },
];

const seedTxs: Tx[] = [
  {
    id: "t-seed-exchange-out",
    accountId: "a-binance",
    categoryId: "c-transfer",
    kind: "expense",
    amount: 200,
    currency: "USDT",
    note: "Cambio de Binance a Mi Dinero USD",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "t-seed-exchange-in",
    accountId: "a-mi-usd",
    categoryId: "c-transfer",
    kind: "income",
    amount: 201.31,
    currency: "USD",
    note: "Entrada por cambio desde Binance",
    date: new Date().toISOString().slice(0, 10),
  },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const todayIso = () => new Date().toISOString().slice(0, 10);

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const dt = new Date(year, (month || 1) - 1, 1);
  return dt.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
};

const txImpact = (tx: Tx) => (tx.kind === "income" ? tx.amount : -tx.amount);

export default function Home() {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [txs, setTxs] = useState<Tx[]>(seedTxs);
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>("USD");
  const [usdUyuRate, setUsdUyuRate] = useState<string>("39.5");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurrings, setRecurrings] = useState<RecurringTx[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  const [newCat, setNewCat] = useState({ name: "", kind: "expense" as Category["kind"] });
  const [newAccount, setNewAccount] = useState({ name: "", currency: "USD", balance: "0" });
  const [newTx, setNewTx] = useState<TxDraft>({
    accountId: "",
    categoryId: "",
    kind: "expense",
    amount: "",
    currency: "USD",
    note: "",
    date: todayIso(),
  });
  const [newBudget, setNewBudget] = useState({ categoryId: "", limit: "", currency: "USD" as BaseCurrency });
  const [newRecurring, setNewRecurring] = useState({
    accountId: "",
    categoryId: "",
    kind: "expense" as Kind,
    amount: "",
    currency: "USD",
    dayOfMonth: "1",
    note: "",
  });
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "income" as GoalType,
    target: "",
    currency: "USD" as BaseCurrency,
    deadline: "",
  });

  const [query, setQuery] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fAccount, setFAccount] = useState("");
  const [fKind, setFKind] = useState<"" | Kind>("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");

  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<TxDraft | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("lume-v4");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.accounts) setAccounts(parsed.accounts);
      if (parsed.txs) setTxs(parsed.txs);
      if (parsed.baseCurrency) setBaseCurrency(parsed.baseCurrency);
      if (parsed.usdUyuRate) setUsdUyuRate(parsed.usdUyuRate);
      if (parsed.budgets) setBudgets(parsed.budgets);
      if (parsed.recurrings) setRecurrings(parsed.recurrings);
      if (parsed.goals) setGoals(parsed.goals);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categories, accounts, txs, baseCurrency, usdUyuRate, budgets, recurrings, goals }),
    );
  }, [categories, accounts, txs, baseCurrency, usdUyuRate, budgets, recurrings, goals]);

  const rate = Number(usdUyuRate) || 39.5;
  const toBase = (amount: number, currency: string, base: BaseCurrency) => {
    const c = currency.toUpperCase();
    const normalized = c === "USDT" ? "USD" : c;
    if (normalized === base) return amount;
    if (normalized === "USD" && base === "UYU") return amount * rate;
    if (normalized === "UYU" && base === "USD") return amount / rate;
    return amount;
  };

  const totals = useMemo(() => {
    const income = txs
      .filter((t) => t.kind === "income")
      .reduce((acc, tx) => acc + toBase(tx.amount, tx.currency, baseCurrency), 0);
    const expense = txs
      .filter((t) => t.kind === "expense")
      .reduce((acc, tx) => acc + toBase(tx.amount, tx.currency, baseCurrency), 0);
    return { income, expense, net: income - expense };
  }, [txs, baseCurrency, usdUyuRate]);

  const accountBalances = useMemo(() => {
    const usd = accounts.reduce((acc, a) => acc + toBase(a.balance, a.currency, "USD"), 0);
    const uyu = accounts.reduce((acc, a) => acc + toBase(a.balance, a.currency, "UYU"), 0);
    const selected = baseCurrency === "USD" ? usd : uyu;
    return { usd, uyu, selected };
  }, [accounts, baseCurrency, usdUyuRate]);

  const recurringProjection = useMemo(() => {
    const recurringIncome = recurrings
      .filter((r) => r.active && r.kind === "income")
      .reduce((acc, r) => acc + toBase(r.amount, r.currency, baseCurrency), 0);
    const recurringExpense = recurrings
      .filter((r) => r.active && r.kind === "expense")
      .reduce((acc, r) => acc + toBase(r.amount, r.currency, baseCurrency), 0);
    return { recurringIncome, recurringExpense, projectedNet: recurringIncome - recurringExpense };
  }, [recurrings, baseCurrency, usdUyuRate]);

  const monthNow = monthKey(new Date());
  const monthPrev = monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));

  const advancedDashboard = useMemo(() => {
    const now = new Date();
    const sevenDaysAhead = new Date(now);
    sevenDaysAhead.setDate(now.getDate() + 7);
    const thirtyDaysAhead = new Date(now);
    thirtyDaysAhead.setDate(now.getDate() + 30);

    const txNetUntil = (until: Date) =>
      txs.reduce((acc, tx) => {
        const d = new Date(tx.date);
        if (d <= until) return acc + toBase(tx.kind === "income" ? tx.amount : -tx.amount, tx.currency, baseCurrency);
        return acc;
      }, 0);

    const recurringInWindow = (days: number) => {
      const nowDate = new Date();
      const endDate = new Date(nowDate);
      endDate.setDate(nowDate.getDate() + days);
      return recurrings
        .filter((r) => r.active)
        .reduce((acc, r) => {
          const hitDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), Math.min(r.dayOfMonth, 28));
          if (hitDate >= nowDate && hitDate <= endDate) {
            return acc + toBase(r.kind === "income" ? r.amount : -r.amount, r.currency, baseCurrency);
          }
          return acc;
        }, 0);
    };

    const projection7 = accountBalances.selected + recurringInWindow(7);
    const projection30 = accountBalances.selected + recurringInWindow(30);

    const expenseByMonth = (month: string) =>
      txs
        .filter((t) => t.kind === "expense" && t.date.slice(0, 7) === month)
        .reduce((acc, t) => acc + toBase(t.amount, t.currency, baseCurrency), 0);

    const expenseCurrent = expenseByMonth(monthNow);
    const expensePrevious = expenseByMonth(monthPrev);
    const trendPct = expensePrevious > 0 ? ((expenseCurrent - expensePrevious) / expensePrevious) * 100 : 0;

    const top3 = Object.entries(
      txs
        .filter((t) => t.kind === "expense" && t.date.slice(0, 7) === monthNow)
        .reduce<Record<string, number>>((acc, t) => {
          acc[t.categoryId] = (acc[t.categoryId] || 0) + toBase(t.amount, t.currency, baseCurrency);
          return acc;
        }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { projection7, projection30, expenseCurrent, expensePrevious, trendPct, top3, txNetUntil, sevenDaysAhead, thirtyDaysAhead };
  }, [txs, recurrings, baseCurrency, usdUyuRate, accountBalances.selected, monthNow, monthPrev]);

  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of txs.filter((t) => t.kind === "expense")) {
      map[tx.categoryId] = (map[tx.categoryId] || 0) + toBase(tx.amount, tx.currency, baseCurrency);
    }
    return map;
  }, [txs, baseCurrency, usdUyuRate]);

  const overBudgetItems = useMemo(
    () =>
      budgets
        .map((b) => {
          const spent = spendByCategory[b.categoryId] || 0;
          const limitBase = toBase(b.limit, b.currency, baseCurrency);
          return { categoryId: b.categoryId, spent, limitBase, excess: spent - limitBase };
        })
        .filter((x) => x.excess > 0)
        .sort((a, b) => b.excess - a.excess),
    [budgets, spendByCategory, baseCurrency, usdUyuRate],
  );

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
      prev.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance + txImpact(tx) } : a)),
    );
    setNewTx((s) => ({ ...s, amount: "", note: "" }));
  };

  const addBudget = () => {
    if (!newBudget.categoryId || !newBudget.limit) return;
    const limit = Number(newBudget.limit);
    if (Number.isNaN(limit) || limit <= 0) return;
    setBudgets((prev) => {
      const clean = prev.filter((b) => b.categoryId !== newBudget.categoryId);
      return [...clean, { categoryId: newBudget.categoryId, limit, currency: newBudget.currency }];
    });
    setNewBudget({ categoryId: "", limit: "", currency: "USD" });
  };

  const addRecurring = () => {
    if (!newRecurring.accountId || !newRecurring.categoryId || !newRecurring.amount) return;
    const amount = Number(newRecurring.amount);
    const dayOfMonth = Number(newRecurring.dayOfMonth);
    if (Number.isNaN(amount) || amount <= 0 || Number.isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return;
    const item: RecurringTx = {
      id: `r-${uid()}`,
      accountId: newRecurring.accountId,
      categoryId: newRecurring.categoryId,
      kind: newRecurring.kind,
      amount,
      currency: newRecurring.currency.toUpperCase(),
      dayOfMonth,
      note: newRecurring.note,
      active: true,
    };
    setRecurrings((prev) => [item, ...prev]);
    setNewRecurring({ accountId: "", categoryId: "", kind: "expense", amount: "", currency: "USD", dayOfMonth: "1", note: "" });
  };

  const applyRecurringThisMonth = () => {
    const now = new Date();
    const currentMonthKey = monthKey(now);
    const toApply = recurrings.filter((r) => r.active && r.lastAppliedMonth !== currentMonthKey);
    if (!toApply.length) return;

    const generated: Tx[] = toApply.map((r) => ({
      id: `t-${uid()}`,
      accountId: r.accountId,
      categoryId: r.categoryId,
      kind: r.kind,
      amount: r.amount,
      currency: r.currency,
      note: r.note || "Recurring",
      date: `${currentMonthKey}-${String(Math.min(r.dayOfMonth, 28)).padStart(2, "0")}`,
    }));

    setTxs((prev) => [...generated, ...prev]);
    setAccounts((prev) =>
      prev.map((a) => {
        const related = generated.filter((g) => g.accountId === a.id);
        if (!related.length) return a;
        const delta = related.reduce((acc, g) => acc + txImpact(g), 0);
        return { ...a, balance: a.balance + delta };
      }),
    );
    setRecurrings((prev) => prev.map((r) => (toApply.some((x) => x.id === r.id) ? { ...r, lastAppliedMonth: currentMonthKey } : r)));
  };

  const addGoal = () => {
    if (!newGoal.title.trim() || !newGoal.target || !newGoal.deadline) return;
    const target = Number(newGoal.target);
    if (Number.isNaN(target) || target <= 0) return;
    setGoals((prev) => [
      ...prev,
      {
        id: `g-${uid()}`,
        title: newGoal.title.trim(),
        type: newGoal.type,
        target,
        currency: newGoal.currency,
        deadline: newGoal.deadline,
      },
    ]);
    setNewGoal({ title: "", type: "income", target: "", currency: "USD", deadline: "" });
  };

  const exportBackup = () => {
    const payload = { categories, accounts, txs, budgets, recurrings, goals, baseCurrency, usdUyuRate };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lume-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
        if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
        if (Array.isArray(parsed.txs)) setTxs(parsed.txs);
        if (Array.isArray(parsed.budgets)) setBudgets(parsed.budgets);
        if (Array.isArray(parsed.recurrings)) setRecurrings(parsed.recurrings);
        if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
        if (parsed.baseCurrency === "USD" || parsed.baseCurrency === "UYU") setBaseCurrency(parsed.baseCurrency);
        if (parsed.usdUyuRate) setUsdUyuRate(String(parsed.usdUyuRate));
      } catch {
        alert("Backup inválido. Verifica que sea un JSON exportado desde Lume.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const startEditTx = (tx: Tx) => {
    setEditingTxId(tx.id);
    setEditingTx({
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      kind: tx.kind,
      amount: String(tx.amount),
      currency: tx.currency,
      note: tx.note,
      date: tx.date,
    });
  };

  const cancelEditTx = () => {
    setEditingTxId(null);
    setEditingTx(null);
  };

  const saveEditTx = () => {
    if (!editingTxId || !editingTx || !editingTx.accountId || !editingTx.categoryId || !editingTx.amount) return;
    const amount = Number(editingTx.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const prevTx = txs.find((t) => t.id === editingTxId);
    if (!prevTx) return;

    const nextTx: Tx = {
      id: editingTxId,
      accountId: editingTx.accountId,
      categoryId: editingTx.categoryId,
      kind: editingTx.kind,
      amount,
      currency: editingTx.currency.toUpperCase(),
      note: editingTx.note.trim(),
      date: editingTx.date,
    };

    setTxs((prev) => prev.map((t) => (t.id === editingTxId ? nextTx : t)));

    setAccounts((prev) =>
      prev.map((a) => {
        let balance = a.balance;
        if (a.id === prevTx.accountId) balance -= txImpact(prevTx);
        if (a.id === nextTx.accountId) balance += txImpact(nextTx);
        return balance === a.balance ? a : { ...a, balance };
      }),
    );

    cancelEditTx();
  };

  const deleteTx = (txId: string) => {
    const target = txs.find((t) => t.id === txId);
    if (!target) return;

    setTxs((prev) => prev.filter((t) => t.id !== txId));
    setAccounts((prev) =>
      prev.map((a) => (a.id === target.accountId ? { ...a, balance: a.balance - txImpact(target) } : a)),
    );
    if (editingTxId === txId) cancelEditTx();
  };

  const goalProgress = (g: FinancialGoal) => {
    const currentBase = g.type === "income" ? totals.income : Math.max(totals.net, 0);
    const currentInGoalCurrency = g.currency === baseCurrency ? currentBase : toBase(currentBase, baseCurrency, g.currency);

    const pct = Math.min((currentInGoalCurrency / g.target) * 100, 100);
    const today = new Date();
    const deadline = new Date(g.deadline);
    const totalDays = Math.max((deadline.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000, 1);
    const elapsedDays = Math.max((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000, 1);
    const expectedPct = Math.min((elapsedDays / totalDays) * 100, 100);
    const status = pct + 8 >= expectedPct ? "on-track" : "at-risk";

    return { current: currentInGoalCurrency, pct, status };
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const filteredTxs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter((t) => {
      const catName = categoryMap[t.categoryId]?.name?.toLowerCase() || "";
      const accName = accountMap[t.accountId]?.name?.toLowerCase() || "";
      const inText = !q || [t.note.toLowerCase(), catName, accName, t.currency.toLowerCase()].some((v) => v.includes(q));
      const inCategory = !fCategory || t.categoryId === fCategory;
      const inAccount = !fAccount || t.accountId === fAccount;
      const inKind = !fKind || t.kind === fKind;
      const inFrom = !fDateFrom || t.date >= fDateFrom;
      const inTo = !fDateTo || t.date <= fDateTo;
      return inText && inCategory && inAccount && inKind && inFrom && inTo;
    });
  }, [txs, query, fCategory, fAccount, fKind, fDateFrom, fDateTo, categoryMap, accountMap]);

  return (
    <main className="min-h-screen bg-[#0b1018] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Lume</p>
          <h1 className="mt-2 text-3xl font-bold">Control de Finanzas Personal</h1>
          <p className="mt-2 text-sm text-zinc-400">Multi-moneda, presupuestos, metas y control operativo diario.</p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <button className="btn" onClick={exportBackup}>Exportar backup JSON</button>
            <label className="btn text-center cursor-pointer">
              Importar backup JSON
              <input className="hidden" type="file" accept="application/json" onChange={importBackup} />
            </label>
          </div>
        </header>

        <section className="mb-4 grid gap-4 md:grid-cols-3">
          <Card title="Moneda base y tipo de cambio">
            <div className="grid grid-cols-2 gap-2">
              <select className="field" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value as BaseCurrency)}>
                <option value="USD">USD</option><option value="UYU">UYU</option>
              </select>
              <input className="field" type="number" step="0.01" value={usdUyuRate} onChange={(e) => setUsdUyuRate(e.target.value)} placeholder="USD→UYU" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">1 USD = {rate.toFixed(2)} UYU</p>
          </Card>
          <Kpi title={`Ingresos (${baseCurrency})`} value={totals.income} />
          <Kpi title={`Consumos (${baseCurrency})`} value={totals.expense} />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Kpi title={`Balance Neto Cuentas (${baseCurrency})`} value={accountBalances.selected} highlight />
          <Kpi title="Balance Cuentas (USD)" value={accountBalances.usd} />
          <Kpi title="Balance Cuentas (UYU)" value={accountBalances.uyu} />
          <Kpi title="Categorías con presupuesto" value={budgets.length} />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <Kpi title={`Neto de movimientos (${baseCurrency})`} value={totals.net} />
          <Kpi title="Recurrings activos" value={recurrings.filter((r) => r.active).length} />
          <Kpi title={`Proyección neta mensual (${baseCurrency})`} value={recurringProjection.projectedNet} highlight={recurringProjection.projectedNet >= 0} />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <Kpi title={`Proyección ingresos fijos (${baseCurrency})`} value={recurringProjection.recurringIncome} />
          <Kpi title={`Proyección gastos fijos (${baseCurrency})`} value={recurringProjection.recurringExpense} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card title="Dashboard avanzado">
            <div className="space-y-3">
              <div className="item block">
                <p className="text-xs text-zinc-400 uppercase tracking-[0.16em]">Cashflow proyectado</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-black/20 p-2">
                    <p className="text-xs text-zinc-400">7 días</p>
                    <p className="text-lg font-semibold">{advancedDashboard.projection7.toFixed(2)} {baseCurrency}</p>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <p className="text-xs text-zinc-400">30 días</p>
                    <p className="text-lg font-semibold">{advancedDashboard.projection30.toFixed(2)} {baseCurrency}</p>
                  </div>
                </div>
              </div>

              <div className="item block">
                <p className="text-xs text-zinc-400 uppercase tracking-[0.16em]">Tendencia de gasto</p>
                <p className="mt-1 text-sm">
                  Mes actual: <b>{advancedDashboard.expenseCurrent.toFixed(2)} {baseCurrency}</b> vs anterior: <b>{advancedDashboard.expensePrevious.toFixed(2)} {baseCurrency}</b>
                </p>
                <span className={`badge mt-2 inline-block ${advancedDashboard.trendPct <= 0 ? "badge-ok" : "badge-risk"}`}>
                  {advancedDashboard.trendPct >= 0 ? "+" : ""}{advancedDashboard.trendPct.toFixed(1)}%
                </span>
              </div>

              <div className="item block">
                <p className="text-xs text-zinc-400 uppercase tracking-[0.16em]">Top 3 categorías ({monthLabel(monthNow)})</p>
                <div className="mt-2 space-y-1">
                  {advancedDashboard.top3.map(([categoryId, amount]) => (
                    <div className="flex items-center justify-between text-sm" key={categoryId}>
                      <span>{categoryMap[categoryId]?.name ?? "Sin categoría"}</span>
                      <span className="text-zinc-300">{amount.toFixed(2)} {baseCurrency}</span>
                    </div>
                  ))}
                  {advancedDashboard.top3.length === 0 ? <p className="text-sm text-zinc-400">Sin gastos este mes.</p> : null}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Agregar movimiento">
            <div className="space-y-2">
              <select className="field" value={newTx.kind} onChange={(e) => setNewTx((s) => ({ ...s, kind: e.target.value as Kind }))}><option value="expense">Consumo</option><option value="income">Ingreso</option></select>
              <select className="field" value={newTx.accountId} onChange={(e) => setNewTx((s) => ({ ...s, accountId: e.target.value }))}><option value="">Cuenta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select className="field" value={newTx.categoryId} onChange={(e) => setNewTx((s) => ({ ...s, categoryId: e.target.value }))}><option value="">Categoría</option>{categories.filter((c) => c.kind === "both" || c.kind === newTx.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <div className="grid grid-cols-2 gap-2"><input className="field" placeholder="Monto" type="number" value={newTx.amount} onChange={(e) => setNewTx((s) => ({ ...s, amount: e.target.value }))} /><input className="field" placeholder="Moneda" value={newTx.currency} onChange={(e) => setNewTx((s) => ({ ...s, currency: e.target.value }))} /></div>
              <input className="field" placeholder="Nota" value={newTx.note} onChange={(e) => setNewTx((s) => ({ ...s, note: e.target.value }))} />
              <input className="field" type="date" value={newTx.date} onChange={(e) => setNewTx((s) => ({ ...s, date: e.target.value }))} />
              <button className="btn" onClick={addTx}>Guardar movimiento</button>
            </div>
          </Card>

          <Card title="Cuentas bancarias">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2"><input className="field" placeholder="Nombre" value={newAccount.name} onChange={(e) => setNewAccount((s) => ({ ...s, name: e.target.value }))} /><input className="field" placeholder="Moneda" value={newAccount.currency} onChange={(e) => setNewAccount((s) => ({ ...s, currency: e.target.value }))} /><input className="field" placeholder="Saldo" type="number" value={newAccount.balance} onChange={(e) => setNewAccount((s) => ({ ...s, balance: e.target.value }))} /></div>
              <button className="btn" onClick={addAccount}>Agregar cuenta</button>
              <div className="space-y-2 pt-2">{accounts.map((a) => <div key={a.id} className="item"><span>{a.name} ({a.currency})</span><span className="font-semibold">{a.balance.toFixed(2)}</span></div>)}</div>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title={`Presupuestos • ${monthLabel(monthNow)}`}>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2"><input className="field col-span-2" placeholder="Nombre categoría" value={newCat.name} onChange={(e) => setNewCat((s) => ({ ...s, name: e.target.value }))} /><select className="field" value={newCat.kind} onChange={(e) => setNewCat((s) => ({ ...s, kind: e.target.value as Category["kind"] }))}><option value="expense">Consumo</option><option value="income">Ingreso</option><option value="both">Ambos</option></select></div>
              <button className="btn" onClick={addCategory}>Agregar categoría</button>
              <div className="mt-3 grid grid-cols-3 gap-2"><select className="field" value={newBudget.categoryId} onChange={(e) => setNewBudget((s) => ({ ...s, categoryId: e.target.value }))}><option value="">Presupuesto categoría</option>{categories.filter((c) => c.kind !== "income").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="field" type="number" placeholder="Límite" value={newBudget.limit} onChange={(e) => setNewBudget((s) => ({ ...s, limit: e.target.value }))} /><select className="field" value={newBudget.currency} onChange={(e) => setNewBudget((s) => ({ ...s, currency: e.target.value as BaseCurrency }))}><option value="USD">USD</option><option value="UYU">UYU</option></select></div>
              <button className="btn" onClick={addBudget}>Guardar presupuesto</button>

              <div className="space-y-2 pt-2">
                {categories.filter((c) => c.kind !== "income").map((c) => {
                  const budget = budgets.find((b) => b.categoryId === c.id);
                  const spent = spendByCategory[c.id] || 0;
                  const limitBase = budget ? toBase(budget.limit, budget.currency, baseCurrency) : 0;
                  const pct = budget && limitBase > 0 ? Math.min((spent / limitBase) * 100, 100) : 0;
                  return (
                    <div key={c.id} className="item block">
                      <div className="flex items-center justify-between"><span>{c.name}</span><span className="badge">{budget ? `${spent.toFixed(0)} / ${limitBase.toFixed(0)} ${baseCurrency}` : "sin presupuesto"}</span></div>
                      {budget ? <div className="mt-2 h-2 rounded bg-white/10"><div className={`h-2 rounded ${pct >= 100 ? "bg-red-500" : "bg-[#d4e83a]"}`} style={{ width: `${pct}%` }} /></div> : null}
                    </div>
                  );
                })}
              </div>

              <div className="item block">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Alertas sobre-presupuesto</p>
                <div className="mt-2 space-y-1">
                  {overBudgetItems.map((item) => (
                    <div key={item.categoryId} className="flex items-center justify-between text-sm">
                      <span>{categoryMap[item.categoryId]?.name}</span>
                      <span className="text-red-300">+{item.excess.toFixed(2)} {baseCurrency}</span>
                    </div>
                  ))}
                  {!overBudgetItems.length ? <p className="text-sm text-zinc-400">Sin alertas este mes.</p> : null}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Metas financieras">
            <div className="space-y-2">
              <input className="field" placeholder="Título meta" value={newGoal.title} onChange={(e) => setNewGoal((s) => ({ ...s, title: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <select className="field" value={newGoal.type} onChange={(e) => setNewGoal((s) => ({ ...s, type: e.target.value as GoalType }))}><option value="income">Meta de ingresos</option><option value="savings">Meta de ahorro</option></select>
                <select className="field" value={newGoal.currency} onChange={(e) => setNewGoal((s) => ({ ...s, currency: e.target.value as BaseCurrency }))}><option value="USD">USD</option><option value="UYU">UYU</option></select>
              </div>
              <div className="grid grid-cols-2 gap-2"><input className="field" type="number" placeholder="Objetivo" value={newGoal.target} onChange={(e) => setNewGoal((s) => ({ ...s, target: e.target.value }))} /><input className="field" type="date" value={newGoal.deadline} onChange={(e) => setNewGoal((s) => ({ ...s, deadline: e.target.value }))} /></div>
              <button className="btn" onClick={addGoal}>Guardar meta</button>
              <div className="space-y-2 pt-1">
                {goals.map((g) => {
                  const p = goalProgress(g);
                  return (
                    <div key={g.id} className="item block">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{g.title}</span>
                        <div className="flex gap-2 items-center">
                          <span className={`badge ${p.status === "on-track" ? "badge-ok" : "badge-risk"}`}>{p.status === "on-track" ? "On track" : "At risk"}</span>
                          <span className="badge">{p.current.toFixed(0)} / {g.target} {g.currency}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{g.type === "income" ? "Ingresos" : "Ahorro"} • deadline {g.deadline}</p>
                      <div className="mt-2 h-2 rounded bg-white/10"><div className="h-2 rounded bg-[#d4e83a]" style={{ width: `${p.pct}%` }} /></div>
                    </div>
                  );
                })}
                {!goals.length ? <p className="text-sm text-zinc-400">Sin metas aún.</p> : null}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Recurring Transactions">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2"><select className="field" value={newRecurring.kind} onChange={(e) => setNewRecurring((s) => ({ ...s, kind: e.target.value as Kind }))}><option value="expense">Consumo</option><option value="income">Ingreso</option></select><input className="field" type="number" placeholder="Día del mes (1-31)" value={newRecurring.dayOfMonth} onChange={(e) => setNewRecurring((s) => ({ ...s, dayOfMonth: e.target.value }))} /></div>
              <select className="field" value={newRecurring.accountId} onChange={(e) => setNewRecurring((s) => ({ ...s, accountId: e.target.value }))}><option value="">Cuenta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select className="field" value={newRecurring.categoryId} onChange={(e) => setNewRecurring((s) => ({ ...s, categoryId: e.target.value }))}><option value="">Categoría</option>{categories.filter((c) => c.kind === "both" || c.kind === newRecurring.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <div className="grid grid-cols-2 gap-2"><input className="field" type="number" placeholder="Monto" value={newRecurring.amount} onChange={(e) => setNewRecurring((s) => ({ ...s, amount: e.target.value }))} /><input className="field" placeholder="Moneda" value={newRecurring.currency} onChange={(e) => setNewRecurring((s) => ({ ...s, currency: e.target.value }))} /></div>
              <input className="field" placeholder="Nota" value={newRecurring.note} onChange={(e) => setNewRecurring((s) => ({ ...s, note: e.target.value }))} />
              <button className="btn" onClick={addRecurring}>Agregar recurring</button>
              <button className="btn" onClick={applyRecurringThisMonth}>Aplicar recurrings de este mes</button>
              <div className="space-y-2 pt-1">{recurrings.map((r) => (<div key={r.id} className="item"><div><p className="font-medium">{r.kind === "income" ? "Ingreso" : "Consumo"} {r.amount} {r.currency}</p><p className="text-xs text-zinc-400">Día {r.dayOfMonth} • {categoryMap[r.categoryId]?.name} • {accountMap[r.accountId]?.name}</p></div><span className="badge">{r.lastAppliedMonth ?? "pendiente"}</span></div>))}{!recurrings.length ? <p className="text-sm text-zinc-400">Sin recurrings aún.</p> : null}</div>
            </div>
          </Card>

          <Card title="Movimientos: búsqueda y edición">
            <div className="space-y-2">
              <input className="field" placeholder="Buscar por nota/categoría/cuenta/moneda" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <select className="field" value={fCategory} onChange={(e) => setFCategory(e.target.value)}><option value="">Todas categorías</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select className="field" value={fAccount} onChange={(e) => setFAccount(e.target.value)}><option value="">Todas cuentas</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select className="field" value={fKind} onChange={(e) => setFKind(e.target.value as "" | Kind)}><option value="">Tipo</option><option value="expense">Consumo</option><option value="income">Ingreso</option></select>
                <input className="field" type="date" value={fDateFrom} onChange={(e) => setFDateFrom(e.target.value)} />
                <input className="field" type="date" value={fDateTo} onChange={(e) => setFDateTo(e.target.value)} />
              </div>

              <div className="space-y-2 pt-2 max-h-[460px] overflow-auto pr-1">
                {filteredTxs.slice(0, 50).map((t) => {
                  const isEditing = editingTxId === t.id && editingTx;
                  return (
                    <div key={t.id} className="item block">
                      {!isEditing ? (
                        <>
                          <div className="flex justify-between gap-2">
                            <div>
                              <p className="font-medium">{categoryMap[t.categoryId]?.name ?? "Sin categoría"} • {accountMap[t.accountId]?.name ?? "Sin cuenta"}</p>
                              <p className="text-xs text-zinc-400">{t.date} {t.note ? `• ${t.note}` : ""}</p>
                            </div>
                            <span className={t.kind === "income" ? "text-green-400" : "text-red-400"}>{t.kind === "income" ? "+" : "-"}{t.amount.toFixed(2)} {t.currency}</span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button className="btn btn-small" onClick={() => startEditTx(t)}>Editar</button>
                            <button className="btn btn-small btn-danger" onClick={() => deleteTx(t.id)}>Eliminar</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid gap-2">
                            <div className="grid grid-cols-2 gap-2"><select className="field" value={editingTx.kind} onChange={(e) => setEditingTx((s) => s ? { ...s, kind: e.target.value as Kind } : s)}><option value="expense">Consumo</option><option value="income">Ingreso</option></select><input className="field" type="date" value={editingTx.date} onChange={(e) => setEditingTx((s) => s ? { ...s, date: e.target.value } : s)} /></div>
                            <div className="grid grid-cols-2 gap-2"><select className="field" value={editingTx.accountId} onChange={(e) => setEditingTx((s) => s ? { ...s, accountId: e.target.value } : s)}><option value="">Cuenta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><select className="field" value={editingTx.categoryId} onChange={(e) => setEditingTx((s) => s ? { ...s, categoryId: e.target.value } : s)}><option value="">Categoría</option>{categories.filter((c) => c.kind === "both" || c.kind === editingTx.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-2"><input className="field" type="number" value={editingTx.amount} onChange={(e) => setEditingTx((s) => s ? { ...s, amount: e.target.value } : s)} /><input className="field" value={editingTx.currency} onChange={(e) => setEditingTx((s) => s ? { ...s, currency: e.target.value } : s)} /></div>
                            <input className="field" value={editingTx.note} onChange={(e) => setEditingTx((s) => s ? { ...s, note: e.target.value } : s)} />
                          </div>
                          <div className="mt-2 flex gap-2"><button className="btn btn-small" onClick={saveEditTx}>Guardar</button><button className="btn btn-small" onClick={cancelEditTx}>Cancelar</button></div>
                        </>
                      )}
                    </div>
                  );
                })}
                {!filteredTxs.length ? <p className="text-sm text-zinc-400">No hay movimientos con esos filtros.</p> : null}
              </div>
            </div>
          </Card>
        </section>
      </div>

      <style jsx global>{`
        .field { width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); padding: 10px 12px; color: white; font-size: 14px; }
        .btn { width: 100%; border-radius: 12px; padding: 10px 12px; font-weight: 600; background: rgba(212,232,58,0.18); border: 1px solid rgba(212,232,58,0.45); color: #f4f7de; box-shadow: 0 0 16px rgba(212,232,58,0.14); }
        .btn-small { width: auto; padding: 7px 12px; font-size: 12px; box-shadow: none; }
        .btn-danger { border-color: rgba(239,68,68,0.65); background: rgba(239,68,68,0.15); color: #fecaca; }
        .item { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255,255,255,0.02); padding: 11px 12px; }
        .badge { border: 1px solid rgba(212,232,58,0.45); background: rgba(212,232,58,0.12); color: ${BRAND}; padding: 2px 8px; border-radius: 999px; font-size: 11px; text-transform: uppercase; }
        .badge-ok { border-color: rgba(52,211,153,0.4); color: #6ee7b7; background: rgba(16,185,129,0.12); }
        .badge-risk { border-color: rgba(251,113,133,0.45); color: #fda4af; background: rgba(244,63,94,0.12); }
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
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
      <h2 className="mb-3 text-sm font-semibold text-[#d4e83a] tracking-[0.12em] uppercase">{title}</h2>
      {children}
    </section>
  );
}
