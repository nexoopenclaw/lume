"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Kind = "expense" | "income";
export type BaseCurrency = "USD" | "UYU";
export type GoalType = "income" | "savings";

export type Category = { id: string; name: string; kind: Kind | "both" };
export type Account = { id: string; name: string; currency: string; balance: number };
export type Tx = {
  id: string;
  accountId: string;
  categoryId: string;
  kind: Kind;
  amount: number;
  currency: string;
  note: string;
  date: string;
};
export type Budget = { categoryId: string; limit: number; currency: BaseCurrency };
export type RecurringTx = {
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
export type FinancialGoal = {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  currency: BaseCurrency;
  deadline: string;
};

export type ReconciliationState = {
  expectedBalance: string;
  realBalance: string;
  reconciledAt?: string;
};

export type SmartAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warn" | "critical";
};

const STORAGE_KEY = "lume-v7";
const uid = () => Math.random().toString(36).slice(2, 9);
const todayIso = () => new Date().toISOString().slice(0, 10);
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const monthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const dt = new Date(year, (month || 1) - 1, 1);
  return dt.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
};

export const fmt = (n: number, digits = 2) =>
  new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

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
    date: todayIso(),
  },
  {
    id: "t-seed-exchange-in",
    accountId: "a-mi-usd",
    categoryId: "c-transfer",
    kind: "income",
    amount: 201.31,
    currency: "USD",
    note: "Entrada por cambio desde Binance",
    date: todayIso(),
  },
];

const txImpact = (tx: Tx) => (tx.kind === "income" ? tx.amount : -tx.amount);

type Store = ReturnType<typeof useFinanceStoreInternal>;
const FinanceContext = createContext<Store | null>(null);

function useFinanceStoreInternal() {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [txs, setTxs] = useState<Tx[]>(seedTxs);
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>("USD");
  const [usdUyuRate, setUsdUyuRate] = useState<string>("39.5");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurrings, setRecurrings] = useState<RecurringTx[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [reconciliations, setReconciliations] = useState<Record<string, ReconciliationState>>({});

  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudCode, setCloudCode] = useState("");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string>("Cloud: no conectado");
  const [authChecked, setAuthChecked] = useState(false);

  const [query, setQuery] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fAccount, setFAccount] = useState("");
  const [fKind, setFKind] = useState<"" | Kind>("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");

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
      if (parsed.reconciliations) setReconciliations(parsed.reconciliations);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categories, accounts, txs, baseCurrency, usdUyuRate, budgets, recurrings, goals, reconciliations }),
    );
  }, [categories, accounts, txs, baseCurrency, usdUyuRate, budgets, recurrings, goals, reconciliations]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCloudUserId(data.user.id);
        setCloudStatus(`Cloud conectado: ${data.user.email ?? data.user.id}`);
      }
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCloudUserId(session.user.id);
        setCloudStatus(`Cloud conectado: ${session.user.email ?? session.user.id}`);
      } else {
        setCloudUserId(null);
      }
      setAuthChecked(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const rate = Number(usdUyuRate) || 39.5;
  const toBase = (amount: number, currency: string, base: BaseCurrency) => {
    const c = currency.toUpperCase();
    const normalized = c === "USDT" ? "USD" : c;
    if (normalized === base) return amount;
    if (normalized === "USD" && base === "UYU") return amount * rate;
    if (normalized === "UYU" && base === "USD") return amount / rate;
    return amount;
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const totals = useMemo(() => {
    const income = txs.filter((t) => t.kind === "income").reduce((acc, tx) => acc + toBase(tx.amount, tx.currency, baseCurrency), 0);
    const expense = txs.filter((t) => t.kind === "expense").reduce((acc, tx) => acc + toBase(tx.amount, tx.currency, baseCurrency), 0);
    return { income, expense, net: income - expense };
  }, [txs, baseCurrency, usdUyuRate]);

  const accountBalances = useMemo(() => {
    const usd = accounts.reduce((acc, a) => acc + toBase(a.balance, a.currency, "USD"), 0);
    const uyu = accounts.reduce((acc, a) => acc + toBase(a.balance, a.currency, "UYU"), 0);
    const selected = baseCurrency === "USD" ? usd : uyu;
    return { usd, uyu, selected };
  }, [accounts, baseCurrency, usdUyuRate]);

  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of txs.filter((t) => t.kind === "expense")) map[tx.categoryId] = (map[tx.categoryId] || 0) + toBase(tx.amount, tx.currency, baseCurrency);
    return map;
  }, [txs, baseCurrency, usdUyuRate]);

  const overBudgetItems = useMemo(
    () => budgets
      .map((b) => {
        const spent = spendByCategory[b.categoryId] || 0;
        const limitBase = toBase(b.limit, b.currency, baseCurrency);
        return { categoryId: b.categoryId, spent, limitBase, excess: spent - limitBase };
      })
      .filter((x) => x.excess > 0)
      .sort((a, b) => b.excess - a.excess),
    [budgets, spendByCategory, baseCurrency, usdUyuRate],
  );

  const monthNow = monthKey(new Date());
  const monthPrev = monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const trendPct = useMemo(() => {
    const byMonth = (month: string) => txs.filter((t) => t.kind === "expense" && t.date.slice(0, 7) === month).reduce((acc, t) => acc + toBase(t.amount, t.currency, baseCurrency), 0);
    const cur = byMonth(monthNow);
    const prev = byMonth(monthPrev);
    return prev > 0 ? ((cur - prev) / prev) * 100 : 0;
  }, [txs, baseCurrency, usdUyuRate, monthNow, monthPrev]);

  const smartAlerts = useMemo<SmartAlert[]>(() => {
    const alerts: SmartAlert[] = [];
    overBudgetItems.forEach((item) => alerts.push({
      id: `ob-${item.categoryId}`,
      title: `Sobre presupuesto: ${categoryMap[item.categoryId]?.name ?? "Categoría"}`,
      description: `Exceso de ${fmt(item.excess)} ${baseCurrency} sobre el límite mensual.`,
      severity: item.limitBase > 0 && item.excess / item.limitBase >= 0.2 ? "critical" : "warn",
    }));
    if (trendPct >= 15) alerts.push({ id: "trend-up", title: "Aumento de gasto mensual", description: `El gasto del mes actual subió ${fmt(trendPct, 1)}% vs ${monthLabel(monthPrev)}.`, severity: trendPct >= 35 ? "critical" : "warn" });
    return alerts.slice(0, 8);
  }, [overBudgetItems, categoryMap, baseCurrency, trendPct, monthPrev]);

  const filteredTxs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter((t) => {
      const catName = categoryMap[t.categoryId]?.name?.toLowerCase() || "";
      const accName = accountMap[t.accountId]?.name?.toLowerCase() || "";
      const inText = !q || [t.note.toLowerCase(), catName, accName, t.currency.toLowerCase()].some((v) => v.includes(q));
      return inText && (!fCategory || t.categoryId === fCategory) && (!fAccount || t.accountId === fAccount) && (!fKind || t.kind === fKind) && (!fDateFrom || t.date >= fDateFrom) && (!fDateTo || t.date <= fDateTo);
    });
  }, [txs, query, fCategory, fAccount, fKind, fDateFrom, fDateTo, categoryMap, accountMap]);

  const sendCloudCode = async () => {
    if (!supabase) return setCloudStatus("Cloud: faltan variables NEXT_PUBLIC_SUPABASE_*");
    if (!cloudEmail.trim()) return setCloudStatus("Cloud: ingresá tu email");
    const { error } = await supabase.auth.signInWithOtp({
      email: cloudEmail.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setCloudStatus(error ? `Cloud error: ${error.message}` : "Te envié un código por email. Pegalo acá para entrar en este navegador.");
  };

  const verifyCloudCode = async () => {
    if (!supabase) return setCloudStatus("Cloud: faltan variables NEXT_PUBLIC_SUPABASE_*");
    if (!cloudEmail.trim()) return setCloudStatus("Cloud: ingresá tu email");
    const token = cloudCode.trim();
    if (!token) return setCloudStatus("Cloud: ingresá el código de verificación");
    const { error } = await supabase.auth.verifyOtp({ email: cloudEmail.trim(), token, type: "email" });
    setCloudStatus(error ? `Cloud error: ${error.message}` : "Cloud: sesión iniciada ✅");
  };

  const signOutCloud = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCloudUserId(null);
    setCloudCode("");
    setCloudStatus("Cloud: sesión cerrada");
  };

  const getPayload = () => ({ categories, accounts, txs, baseCurrency, usdUyuRate, budgets, recurrings, goals, reconciliations });
  const saveCloud = async () => {
    if (!supabase) return setCloudStatus("Cloud: no configurado");
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) return setCloudStatus("Cloud: iniciá sesión primero");
    const { error } = await supabase.from("lume_state").upsert({ user_id: data.user.id, state: getPayload() });
    setCloudStatus(error ? `Cloud error: ${error.message}` : "Cloud: guardado ✅");
  };

  const loadCloud = async () => {
    if (!supabase) return setCloudStatus("Cloud: no configurado");
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return setCloudStatus("Cloud: iniciá sesión primero");
    const { data, error } = await supabase.from("lume_state").select("state").eq("user_id", userId).maybeSingle();
    if (error) return setCloudStatus(`Cloud error: ${error.message}`);
    if (!data?.state) return setCloudStatus("Cloud: sin backup para este usuario");
    const s = data.state as Partial<ReturnType<typeof getPayload>>;
    if (s.categories) setCategories(s.categories as Category[]);
    if (s.accounts) setAccounts(s.accounts as Account[]);
    if (s.txs) setTxs(s.txs as Tx[]);
    if (s.baseCurrency) setBaseCurrency(s.baseCurrency as BaseCurrency);
    if (s.usdUyuRate) setUsdUyuRate(String(s.usdUyuRate));
    if (s.budgets) setBudgets(s.budgets as Budget[]);
    if (s.recurrings) setRecurrings(s.recurrings as RecurringTx[]);
    if (s.goals) setGoals(s.goals as FinancialGoal[]);
    if (s.reconciliations) setReconciliations(s.reconciliations as Record<string, ReconciliationState>);
    setCloudStatus("Cloud: datos cargados ✅");
  };

  return {
    categories, accounts, txs, budgets, recurrings, goals, reconciliations,
    baseCurrency, setBaseCurrency, usdUyuRate, setUsdUyuRate,
    cloudEmail, setCloudEmail, cloudCode, setCloudCode, cloudUserId, cloudStatus, authChecked,
    connectCloud: sendCloudCode, sendCloudCode, verifyCloudCode, signOutCloud, saveCloud, loadCloud,
    accountMap, categoryMap, totals, accountBalances, spendByCategory, overBudgetItems, smartAlerts, filteredTxs,
    query, setQuery, fCategory, setFCategory, fAccount, setFAccount, fKind, setFKind, fDateFrom, setFDateFrom, fDateTo, setFDateTo,
    toBase,
    addCategory: (name: string, kind: Category["kind"]) => name.trim() && setCategories((p) => [...p, { id: `c-${uid()}`, name: name.trim(), kind }]),
    addAccount: (name: string, currency: string, balance: string) => name.trim() && setAccounts((p) => [...p, { id: `a-${uid()}`, name: name.trim(), currency: currency.toUpperCase(), balance: Number(balance || 0) }]),
    addTx: (draft: Omit<Tx, "id">) => {
      if (!draft.accountId || !draft.categoryId || draft.amount <= 0) return;
      const tx: Tx = { ...draft, id: `t-${uid()}`, currency: draft.currency.toUpperCase(), note: draft.note.trim() };
      setTxs((p) => [tx, ...p]);
      setAccounts((p) => p.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance + txImpact(tx) } : a)));
    },
    addBudget: (categoryId: string, limit: string, currency: BaseCurrency) => {
      const n = Number(limit); if (!categoryId || n <= 0) return;
      setBudgets((p) => [...p.filter((b) => b.categoryId !== categoryId), { categoryId, limit: n, currency }]);
    },
    addRecurring: (x: Omit<RecurringTx, "id" | "active">) => setRecurrings((p) => [{ ...x, id: `r-${uid()}`, active: true }, ...p]),
    applyRecurringThisMonth: () => {
      const now = new Date();
      const currentMonthKey = monthKey(now);
      const toApply = recurrings.filter((r) => r.active && r.lastAppliedMonth !== currentMonthKey);
      if (!toApply.length) return;
      const generated: Tx[] = toApply.map((r) => ({ id: `t-${uid()}`, accountId: r.accountId, categoryId: r.categoryId, kind: r.kind, amount: r.amount, currency: r.currency, note: r.note || "Recurring", date: `${currentMonthKey}-${String(Math.min(r.dayOfMonth, 28)).padStart(2, "0")}` }));
      setTxs((p) => [...generated, ...p]);
      setAccounts((p) => p.map((a) => {
        const delta = generated.filter((g) => g.accountId === a.id).reduce((acc, g) => acc + txImpact(g), 0);
        return delta ? { ...a, balance: a.balance + delta } : a;
      }));
      setRecurrings((p) => p.map((r) => (toApply.some((x) => x.id === r.id) ? { ...r, lastAppliedMonth: currentMonthKey } : r)));
    },
    addGoal: (g: Omit<FinancialGoal, "id">) => setGoals((p) => [...p, { ...g, id: `g-${uid()}` }]),
    goalProgress: (g: FinancialGoal) => {
      const currentBase = g.type === "income" ? totals.income : Math.max(totals.net, 0);
      const current = g.currency === baseCurrency ? currentBase : toBase(currentBase, baseCurrency, g.currency);
      const pct = Math.min((current / g.target) * 100, 100);
      return { current, pct, status: pct >= 60 ? "on-track" : "at-risk" as "on-track" | "at-risk" };
    },
    updateReconciliation: (accountId: string, field: "expectedBalance" | "realBalance", value: string) => setReconciliations((prev) => ({ ...prev, [accountId]: { expectedBalance: prev[accountId]?.expectedBalance ?? String(accountMap[accountId]?.balance ?? 0), realBalance: prev[accountId]?.realBalance ?? "", reconciledAt: prev[accountId]?.reconciledAt, [field]: value } })),
    markAccountReconciled: (accountId: string) => setReconciliations((prev) => ({ ...prev, [accountId]: { expectedBalance: prev[accountId]?.expectedBalance ?? String(accountMap[accountId]?.balance ?? 0), realBalance: prev[accountId]?.realBalance ?? "", reconciledAt: new Date().toISOString() } })),
    deleteTx: (txId: string) => {
      const target = txs.find((t) => t.id === txId); if (!target) return;
      setTxs((p) => p.filter((t) => t.id !== txId));
      setAccounts((p) => p.map((a) => (a.id === target.accountId ? { ...a, balance: a.balance - txImpact(target) } : a)));
    },
    exportBackup: () => {
      const payload = { categories, accounts, txs, budgets, recurrings, goals, reconciliations, baseCurrency, usdUyuRate };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `lume-backup-${todayIso()}.json`; a.click(); URL.revokeObjectURL(url);
    },
    importBackupText: (text: string) => {
      const parsed = JSON.parse(text || "{}");
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
      if (Array.isArray(parsed.txs)) setTxs(parsed.txs);
      if (Array.isArray(parsed.budgets)) setBudgets(parsed.budgets);
      if (Array.isArray(parsed.recurrings)) setRecurrings(parsed.recurrings);
      if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
      if (parsed.reconciliations) setReconciliations(parsed.reconciliations);
      if (parsed.baseCurrency === "USD" || parsed.baseCurrency === "UYU") setBaseCurrency(parsed.baseCurrency);
      if (parsed.usdUyuRate) setUsdUyuRate(String(parsed.usdUyuRate));
    }
  };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const value = useFinanceStoreInternal();
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinanceStore() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinanceStore requiere FinanceProvider");
  return ctx;
}
