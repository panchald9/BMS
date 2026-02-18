import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, Info } from "lucide-react";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------- helpers ------------------------------- */

function uid() {
  return Math.random().toString(16).slice(2, 10);
}

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toNum(v) {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : 0;
}

function clampPct(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatMoney(n) {
  return n.toFixed(2);
}

function formatDateDDMMYYYY(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
}

/* ----------------------------- seed data -------------------------------- */

const PAYMENT_METHODS_SEED = [
  { id: "pm-1", name: "Cash" },
  { id: "pm-2", name: "Bank Transfer" },
  { id: "pm-3", name: "JazzCash" },
];

const GROUPS = [
  { id: "pg-1", name: "Processing Group A", clientName: "Client A", type: "processing" },
  { id: "pg-2", name: "Processing Group B", clientName: "Client B", type: "processing" },
  { id: "pay-1", name: "Payment Group 1", clientName: "Client C", type: "payment" },
  { id: "pay-2", name: "Payment Group 2", clientName: "Client D", type: "payment" },
];

/* ----------------------------- component -------------------------------- */

export default function ProcessingPaymentPage() {
  const [, setLocation] = useLocation();

  const [activeStep, setActiveStep] = useState("Add Payment");
  const [date, setDate] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [dollarRate, setDollarRate] = useState("");
  const [processingPct, setProcessingPct] = useState("");
  const [processingGroupId, setProcessingGroupId] = useState("");
  const [paymentGroupPct, setPaymentGroupPct] = useState("");
  const [paymentGroupId, setPaymentGroupId] = useState("");

  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS_SEED);
  const [transactions, setTransactions] = useState([]);

  /* ----------------------------- calculations ---------------------------- */

  const amountUsdNum = useMemo(() => Math.max(0, toNum(amountUsd)), [amountUsd]);
  const dollarRateNum = useMemo(() => Math.max(0, toNum(dollarRate)), [dollarRate]);

  const processingPctNum = useMemo(() => clampPct(toNum(processingPct)), [processingPct]);
  const paymentGroupPctNum = useMemo(() => clampPct(toNum(paymentGroupPct)), [paymentGroupPct]);

  const processingTotal = useMemo(() => {
    return amountUsdNum * (processingPctNum / 100) * dollarRateNum;
  }, [amountUsdNum, dollarRateNum, processingPctNum]);

  const paymentTotal = useMemo(() => {
    const base = amountUsdNum * dollarRateNum;
    return ((base * paymentGroupPctNum) / 100) * -1;
  }, [amountUsdNum, dollarRateNum, paymentGroupPctNum]);

  const canSave =
    date && paymentTypeId && amountUsdNum > 0 && dollarRateNum > 0 && processingGroupId && paymentGroupId;

  /* ----------------------------- save ------------------------------------ */

  function onSave(e) {
    e.preventDefault();
    if (!canSave) return;

    const tx = {
      id: uid(),
      dateISO: date,
      amountUsd: amountUsdNum,
      dollarRate: dollarRateNum,
      processingPct: processingPctNum,
      paymentPct: paymentGroupPctNum,
      processingTotalInr: processingTotal,
      paymentTotalInr: paymentTotal,
    };

    setTransactions([tx, ...transactions]);

    setDate("");
    setAmountUsd("");
    setDollarRate("");
    setProcessingPct("");
    setPaymentGroupPct("");
  }

  /* ----------------------------- UI -------------------------------------- */

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Payment Processing</h1>

      <form onSubmit={onSave}>
        <h3>Transaction Details</h3>

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <br /><br />

        <select value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)}>
          <option value="">Select Payment Method</option>
          {paymentMethods.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <br /><br />

        <input
          placeholder="Amount USD"
          value={amountUsd}
          onChange={(e) => setAmountUsd(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Dollar Rate"
          value={dollarRate}
          onChange={(e) => setDollarRate(e.target.value)}
        />

        <h3>Processing</h3>

        <input
          placeholder="Processing %"
          value={processingPct}
          onChange={(e) => setProcessingPct(e.target.value)}
        />

        <h3>Payment Group</h3>

        <input
          placeholder="Payment Group %"
          value={paymentGroupPct}
          onChange={(e) => setPaymentGroupPct(e.target.value)}
        />

        <br /><br />

        <div>Processing Total ₹ {formatMoney(processingTotal)}</div>
        <div>Payment Total ₹ {formatMoney(paymentTotal)}</div>

        <br />
        <button disabled={!canSave}>Save Transaction</button>
      </form>

      <hr />

      <h2>Transactions</h2>
      {transactions.map((t) => (
        <div key={t.id}>
          {formatDateDDMMYYYY(t.dateISO)} — ${t.amountUsd} — ₹{formatMoney(t.processingTotalInr)}
        </div>
      ))}
    </div>
  );
}
