import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, Info } from "lucide-react";
import { formatDateDDMMYYYY, parseDDMMYYYYToISO, todayISO } from "../lib/date";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";

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

function formatMoney(n, suffix) {
  return `${n.toFixed(2)}${suffix}`;
}

function TabButton({ active, label, onClick, testId }) {
  return (
    <button
      className={
        "relative rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 " +
        (active
          ? "bg-white text-foreground shadow-sm ring-1 ring-border"
          : "bg-transparent text-muted-foreground hover:bg-white/60 hover:text-foreground")
      }
      onClick={onClick}
      data-testid={testId}
      type="button"
    >
      {label}
    </button>
  );
}

export default function ProcessingPaymentPage() {
  const [, setLocation] = useLocation();

  const [activeStep, setActiveStep] = useState("Add Payment");

  const [date, setDate] = useState("");
  const [dateText, setDateText] = useState("");
  const [editingDollarRateId, setEditingDollarRateId] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [dollarRate, setDollarRate] = useState("");

  const seeded = useMemo(() => {
    const sampleRates = [
      { id: "dr-1", date: todayISO(), rate: 83.25 },
      { id: "dr-2", date: parseDDMMYYYYToISO("01-02-2026") ?? todayISO(), rate: 83.1 },
      { id: "dr-3", date: parseDDMMYYYYToISO("31-01-2026") ?? todayISO(), rate: 82.95 },
    ];

    const sampleTransactions = [
      {
        id: "tx-1",
        dateISO: parseDDMMYYYYToISO("01-02-2026") ?? todayISO(),
        paymentTypeId: "pm-2",
        amountUsd: 250,
        dollarRate: 83.1,
        processingGroupId: "pg-1",
        paymentGroupId: "pay-1",
        processingPct: 5,
        paymentPct: 2.5,
        processingTotalInr: 250 * (5 / 100) * 83.1,
        paymentTotalInr: (250 * (2.5 / 100) * 83.1) * -1,
      },
      {
        id: "tx-2",
        dateISO: parseDDMMYYYYToISO("31-01-2026") ?? todayISO(),
        paymentTypeId: "pm-1",
        amountUsd: 1000,
        dollarRate: 82.95,
        processingGroupId: "pg-2",
        paymentGroupId: "pay-2",
        processingPct: 4,
        paymentPct: 3,
        processingTotalInr: 1000 * (4 / 100) * 82.95,
        paymentTotalInr: (1000 * (3 / 100) * 82.95) * -1,
      },
    ];

    return { sampleRates, sampleTransactions };
  }, []);

  const [dollarRateEntries, setDollarRateEntries] = useState(seeded.sampleRates);
  const [transactions, setTransactions] = useState(seeded.sampleTransactions);
  const [processingPct, setProcessingPct] = useState("");
  const [processingGroupId, setProcessingGroupId] = useState("");
  const [paymentGroupPct, setPaymentGroupPct] = useState("");
  const [paymentGroupId, setPaymentGroupId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS_SEED);
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");

  const selectedProcessingGroup = useMemo(
    () => GROUPS.find((g) => g.type === "processing" && g.id === processingGroupId),
    [processingGroupId]
  );
  const selectedPaymentGroup = useMemo(
    () => GROUPS.find((g) => g.type === "payment" && g.id === paymentGroupId),
    [paymentGroupId]
  );

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

  const [editingTransactionId, setEditingTransactionId] = useState("");

  const canSave = useMemo(() => {
    if (!date.trim()) return false;
    if (!paymentTypeId) return false;
    if (!Number.isFinite(amountUsdNum) || amountUsdNum <= 0) return false;
    if (!Number.isFinite(dollarRateNum) || dollarRateNum <= 0) return false;
    if (!processingGroupId) return false;
    if (!paymentGroupId) return false;
    return true;
  }, [date, paymentTypeId, amountUsdNum, dollarRateNum, processingGroupId, paymentGroupId]);

  function onSave(e) {
    e.preventDefault();
    if (!canSave) return;

    const nextTx = {
      id: editingTransactionId || uid(),
      dateISO: date,
      paymentTypeId,
      amountUsd: amountUsdNum,
      dollarRate: dollarRateNum,
      processingGroupId,
      paymentGroupId,
      processingPct: processingPctNum,
      paymentPct: paymentGroupPctNum,
      processingTotalInr: processingTotal,
      paymentTotalInr: paymentTotal,
    };

    setTransactions((prev) => {
      if (!editingTransactionId) return [nextTx, ...prev];
      return prev.map((t) => (t.id === editingTransactionId ? nextTx : t));
    });

    setEditingTransactionId("");
    setActiveStep("Processing Details");
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-processing-payment-title">
                Payment Processing
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-processing-payment-subtitle">
                Capture payment inputs, then calculate processing and payment-group totals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-processing-mode">
                Prototype
              </Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border bg-muted/20 p-2" data-testid="tabs-processing-payment">
            <div className="flex flex-wrap items-center gap-2">
              <TabButton
                active={activeStep === "Add Payment"}
                label="Add Payment"
                onClick={() => setActiveStep("Add Payment")}
                testId="tab-processing-payment"
              />
              <TabButton
                active={activeStep === "Payment Type"}
                label="Payment Type"
                onClick={() => setActiveStep("Payment Type")}
                testId="tab-payment-type"
              />
              <TabButton
                active={activeStep === "Dollar Rate"}
                label="Dollar Rate"
                onClick={() => setActiveStep("Dollar Rate")}
                testId="tab-dollar-rate"
              />
              <TabButton
                active={activeStep === "Processing Details"}
                label="Processing Details"
                onClick={() => setActiveStep("Processing Details")}
                testId="tab-processing-details"
              />
              <TabButton
                active={activeStep === "Client Details"}
                label="Client Details"
                onClick={() => setActiveStep("Client Details")}
                testId="tab-client-details"
              />
            </div>
          </div>

          <Card className="mt-6 rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-processing-payment">
            {activeStep === "Payment Type" ? (
              <div className="space-y-6" data-testid="panel-payment-type">
                <div className="text-xl font-semibold" data-testid="text-payment-methods-title">
                  Manage Payment Methods
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_110px]" data-testid="form-payment-methods">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pm-new" data-testid="label-payment-method-new">
                      Add Payment Method
                    </Label>
                    <Input
                      id="pm-new"
                      value={newPaymentMethodName}
                      onChange={(e) => setNewPaymentMethodName(e.target.value)}
                      placeholder="Add Payment Method"
                      className="mt-1 h-11"
                      data-testid="input-payment-method-new"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="h-11 w-full"
                      data-testid="button-payment-method-add"
                      onClick={() => {
                        const name = newPaymentMethodName.trim();
                        if (!name) return;
                        const id = `pm-${slugify(name) || uid()}`;
                        if (paymentMethods.some((m) => m.id === id || m.name.toLowerCase() === name.toLowerCase())) return;
                        setPaymentMethods((prev) => [...prev, { id, name }]);
                        setNewPaymentMethodName("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-white" data-testid="table-payment-methods">
                  <div
                    className="grid grid-cols-[1fr_160px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-semibold"
                    data-testid="row-payment-methods-header"
                  >
                    <div data-testid="text-payment-method-header-name">Payment Method</div>
                    <div data-testid="text-payment-method-header-action">Action</div>
                  </div>

                  {paymentMethods.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="text-payment-methods-empty">
                      No methods added.
                    </div>
                  ) : (
                    <div className="divide-y" data-testid="list-payment-methods">
                      {paymentMethods.map((m) => (
                        <div
                          key={m.id}
                          className="grid grid-cols-[1fr_160px] items-center gap-3 px-4 py-3"
                          data-testid={`row-payment-method-${m.id}`}
                        >
                          <div className="text-sm" data-testid={`text-payment-method-name-${m.id}`}>
                            {m.name}
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-9"
                              data-testid={`button-payment-method-delete-${m.id}`}
                              onClick={() => setPaymentMethods((prev) => prev.filter((x) => x.id !== m.id))}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeStep === "Dollar Rate" ? (
              <div className="space-y-6" data-testid="panel-dollar-rate">
                <div className="text-xl font-semibold" data-testid="text-dollar-rate-title">
                  Set Daily Dollar Rate
                </div>

                <div className="space-y-4" data-testid="form-dollar-rate">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="dr-date" data-testid="label-dr-date">
                      Date
                    </Label>
                    <DateInput
                      valueISO={date}
                      onChangeISO={(iso) => {
                        setDate(iso);
                        setDateText(formatDateDDMMYYYY(iso));
                      }}
                      maxISO={todayISO()}
                      inputTestId="input-dr-date"
                      buttonTestId="button-dr-date-calendar"
                      popoverTestId="popover-dr-date"
                    />
                    <div className="mt-1 text-xs text-muted-foreground" data-testid="hint-dr-date">
                      Format: DD-MM-YYYY (no future dates)
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="dr-rate" data-testid="label-dr-rate">
                      Dollar Rate (₹)
                    </Label>
                    <Input
                      id="dr-rate"
                      inputMode="decimal"
                      placeholder="e.g. 84.50"
                      value={dollarRate}
                      onChange={(e) => setDollarRate(e.target.value)}
                      className="mt-1 h-11"
                      data-testid="input-dr-rate"
                    />
                  </div>

                  <Button
                    type="button"
                    className="h-12 w-full rounded-xl"
                    data-testid="button-save-rate"
                    onClick={() => {
                      const d = date.trim();
                      const rate = toNum(dollarRate);
                      if (!d) return;
                      if (d > todayISO()) return;
                      if (!Number.isFinite(rate) || rate <= 0) return;

                      if (editingDollarRateId) {
                        setDollarRateEntries((prev) => {
                          const next = prev.map((x) => (x.id === editingDollarRateId ? { ...x, date: d, rate } : x));
                          next.sort((a, b) => (a.date < b.date ? 1 : -1));
                          return next;
                        });
                      } else {
                        const entry = { id: `dr-${uid()}`, date: d, rate };
                        setDollarRateEntries((prev) => {
                          const next = [entry, ...prev.filter((x) => x.date !== d)];
                          next.sort((a, b) => (a.date < b.date ? 1 : -1));
                          return next;
                        });
                      }

                      setDollarRate("");
                      setEditingDollarRateId("");
                      setDate("");
                      setDateText("");
                    }}
                  >
                    Save Rate
                  </Button>
                </div>

                <div className="space-y-3" data-testid="section-recent-rates">
                  <div className="text-sm font-semibold" data-testid="text-recent-rates-title">
                    Recent Rates
                  </div>
                  <div className="overflow-hidden rounded-xl border bg-white" data-testid="table-recent-rates">
                    <div
                      className="grid grid-cols-[1fr_1fr_160px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-semibold"
                      data-testid="row-recent-rates-header"
                    >
                      <div data-testid="text-rate-header-date">Date</div>
                      <div data-testid="text-rate-header-rate">Rate (₹)</div>
                      <div data-testid="text-rate-header-action">Action</div>
                    </div>

                    {dollarRateEntries.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="text-recent-rates-empty">
                        No rates added yet.
                      </div>
                    ) : (
                      <div className="divide-y" data-testid="list-recent-rates">
                        {dollarRateEntries.map((r) => (
                          <div
                            key={r.id}
                            className="grid grid-cols-[1fr_1fr_160px] items-center gap-3 px-4 py-3"
                            data-testid={`row-recent-rate-${r.id}`}
                          >
                            <div className="text-sm" data-testid={`text-recent-rate-date-${r.id}`}>{formatDateDDMMYYYY(r.date)}</div>
                            <div className="text-sm" data-testid={`text-recent-rate-value-${r.id}`}>{r.rate.toFixed(2)}</div>
                            <div className="flex justify-end">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9"
                                  data-testid={`button-recent-rate-edit-${r.id}`}
                                  onClick={() => {
                                    setEditingDollarRateId(r.id);
                                    setDate(r.date);
                                    setDateText(formatDateDDMMYYYY(r.date));
                                    setDollarRate(String(r.rate));
                                    window.setTimeout(() => {
                                      const el = document.getElementById("dr-rate");
                                      el?.focus();
                                      el?.select();
                                    }, 0);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9"
                                  data-testid={`button-recent-rate-delete-${r.id}`}
                                  onClick={() => setDollarRateEntries((prev) => prev.filter((x) => x.id !== r.id))}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeStep === "Processing Details" ? (
              <div className="space-y-5" data-testid="panel-processing-details">
                <div className="text-xl font-semibold" data-testid="text-processing-details-title">
                  Processing Details Log
                </div>

                <div className="overflow-hidden rounded-xl border bg-white" data-testid="table-processing-details">
                  <div
                    className="grid min-w-[980px] grid-cols-[120px_110px_110px_150px_140px_110px_110px_150px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-semibold"
                    data-testid="row-processing-details-header"
                  >
                    <div data-testid="text-proc-header-date">Date</div>
                    <div data-testid="text-proc-header-amount">Amount ($)</div>
                    <div data-testid="text-proc-header-rate">Rate (₹)</div>
                    <div data-testid="text-proc-header-group">Processing Group</div>
                    <div data-testid="text-proc-header-name">Client</div>
                    <div data-testid="text-proc-header-pct">Proc. %</div>
                    <div data-testid="text-proc-header-total">Processing Total (₹)</div>
                    <div data-testid="text-proc-header-action">Action</div>
                  </div>

                  <div className="overflow-x-auto" data-testid="scroll-processing-details">
                    {transactions.length === 0 ? (
                      <div
                        className="min-w-[980px] px-4 py-10 text-center text-sm text-muted-foreground"
                        data-testid="text-processing-details-empty"
                      >
                        No transactions found.
                      </div>
                    ) : (
                      <div className="divide-y" data-testid="list-processing-details">
                        {transactions.map((t) => {
                          const pm = paymentMethods.find((m) => m.id === t.paymentTypeId)?.name ?? "—";
                          const pg = GROUPS.find((g) => g.id === t.processingGroupId)?.name ?? "—";
                          const name = GROUPS.find((g) => g.id === t.processingGroupId)?.clientName ?? "—";

                          return (
                            <div
                              key={t.id}
                              className="grid min-w-[980px] grid-cols-[120px_110px_110px_150px_140px_110px_110px_150px] items-center gap-3 px-4 py-3"
                              data-testid={`row-processing-details-${t.id}`}
                            >
                              <div className="text-sm" data-testid={`text-proc-date-${t.id}`}>{formatDateDDMMYYYY(t.dateISO)}</div>
                              <div className="text-sm" data-testid={`text-proc-amount-${t.id}`}>{t.amountUsd.toFixed(2)}</div>
                              <div className="text-sm" data-testid={`text-proc-rate-${t.id}`}>{t.dollarRate.toFixed(2)}</div>
                              <div className="text-sm" data-testid={`text-proc-group-${t.id}`}>{pg}</div>
                              <div className="text-sm" data-testid={`text-proc-name-${t.id}`}>{name}</div>
                              <div className="text-sm" data-testid={`text-proc-pct-${t.id}`}>{t.processingPct.toFixed(2)}</div>
                              <div className="text-sm" data-testid={`text-proc-total-${t.id}`}>{t.processingTotalInr.toFixed(2)}</div>
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9"
                                  data-testid={`button-proc-edit-${t.id}`}
                                  onClick={() => {
                                    setEditingTransactionId(t.id);
                                    setDate(t.dateISO);
                                    setPaymentTypeId(t.paymentTypeId);
                                    setAmountUsd(String(t.amountUsd));
                                    setDollarRate(String(t.dollarRate));
                                    setProcessingGroupId(t.processingGroupId);
                                    setPaymentGroupId(t.paymentGroupId);
                                    setProcessingPct(String(t.processingPct));
                                    setPaymentGroupPct(String(t.paymentPct));
                                    setActiveStep("Add Payment");
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9"
                                  data-testid={`button-proc-delete-${t.id}`}
                                  onClick={() => setTransactions((prev) => prev.filter((x) => x.id !== t.id))}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeStep === "Client Details" ? (
              <div className="space-y-5" data-testid="panel-client-details">
                <div className="text-xl font-semibold" data-testid="text-client-details-title">
                  Payment Group Details Log
                </div>

                <div className="overflow-hidden rounded-xl border bg-white" data-testid="table-client-details">
                  <div
                    className="grid min-w-[980px] grid-cols-[120px_110px_110px_170px_140px_110px_110px_150px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-semibold"
                    data-testid="row-client-details-header"
                  >
                    <div data-testid="text-pay-header-date">Date</div>
                    <div data-testid="text-pay-header-amount">Amount ($)</div>
                    <div data-testid="text-pay-header-rate">Rate (₹)</div>
                    <div data-testid="text-pay-header-group">Payment Group</div>
                    <div data-testid="text-pay-header-name">Client</div>
                    <div data-testid="text-pay-header-pct">Pay %</div>
                    <div data-testid="text-pay-header-total">Payment Total (₹)</div>
                    <div data-testid="text-pay-header-action">Action</div>
                  </div>

                  <div className="overflow-x-auto" data-testid="scroll-client-details">
                    {transactions.length === 0 ? (
                      <div
                        className="min-w-[980px] px-4 py-10 text-center text-sm text-muted-foreground"
                        data-testid="text-client-details-empty"
                      >
                        No transactions found.
                      </div>
                    ) : (
                      <div className="divide-y" data-testid="list-client-details">
                        {transactions.map((t) => {
                          const pm = paymentMethods.find((m) => m.id === t.paymentTypeId)?.name ?? "—";
                          const g = GROUPS.find((x) => x.id === t.paymentGroupId)?.name ?? "—";
                          const name = GROUPS.find((x) => x.id === t.paymentGroupId)?.clientName ?? "—";

                          return (
                            <div
                              key={t.id}
                              className="grid min-w-[980px] grid-cols-[120px_110px_110px_170px_140px_110px_110px_150px] items-center gap-3 px-4 py-3"
                              data-testid={`row-client-details-${t.id}`}
                            >
                              <div className="text-sm" data-testid={`text-pay-date-${t.id}`}>{formatDateDDMMYYYY(t.dateISO)}</div>
                              <div className="text-sm" data-testid={`text-pay-amount-${t.id}`}>{t.amountUsd.toFixed(2)}</div>
                              <div className="text-sm" data-testid={`text-pay-rate-${t.id}`}>{t.dollarRate.toFixed(2)}</div>
                              <div className="text-sm" data-testid={`text-pay-group-${t.id}`}>{g}</div>
                              <div className="text-sm" data-testid={`text-pay-name-${t.id}`}>{name}</div>
                              <div className="text-sm" data-testid={`text-pay-pct-${t.id}`}>{t.paymentPct.toFixed(2)}</div>
                              <div className="text-sm" data-testid={`text-pay-total-${t.id}`}>{t.paymentTotalInr.toFixed(2)}</div>
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9"
                                  data-testid={`button-pay-edit-${t.id}`}
                                  onClick={() => {
                                    setEditingTransactionId(t.id);
                                    setDate(t.dateISO);
                                    setPaymentTypeId(t.paymentTypeId);
                                    setAmountUsd(String(t.amountUsd));
                                    setDollarRate(String(t.dollarRate));
                                    setProcessingGroupId(t.processingGroupId);
                                    setPaymentGroupId(t.paymentGroupId);
                                    setProcessingPct(String(t.processingPct));
                                    setPaymentGroupPct(String(t.paymentPct));
                                    setActiveStep("Add Payment");
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9"
                                  data-testid={`button-pay-delete-${t.id}`}
                                  onClick={() => setTransactions((prev) => prev.filter((x) => x.id !== t.id))}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSave} className="space-y-6" data-testid="form-add-payment">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground" data-testid="text-transaction-details-heading">
                  <Info className="h-4 w-4 text-primary" /> Transaction Details
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="grid-transaction-details">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-date" data-testid="label-pp-date">
                      Date
                    </Label>
                    <Input
                      id="pp-date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const next = e.target.value;
                        setDate(next);
                        const match = dollarRateEntries.find((x) => x.date === next);
                        if (!match) {
                          setDollarRate("0");
                          return;
                        }
                        setDollarRate(String(match.rate));
                      }}
                      className="mt-1 h-11"
                      data-testid="input-pp-date"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" data-testid="label-pp-payment-type">
                      Payment Type
                    </Label>
                    <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
                      <SelectTrigger className="mt-1 h-11" data-testid="select-pp-payment-type">
                        <SelectValue placeholder="Select Method..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.id} value={m.id} data-testid={`option-payment-type-${m.id}`}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-amount" data-testid="label-pp-amount">
                      Amount ($)
                    </Label>
                    <Input
                      id="pp-amount"
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={amountUsd || ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        const num = Number(next);
                        if (Number.isNaN(num)) return;
                        if (num < 0) return;
                        setAmountUsd(next);
                      }}
                      className="mt-1 h-11"
                      data-testid="input-pp-amount"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-dollar-rate" data-testid="label-pp-dollar-rate">
                      Dollar Rate (₹)
                    </Label>
                    <div
                      id="pp-dollar-rate"
                      className="mt-1 flex h-11 items-center rounded-md border bg-muted/20 px-3 text-sm"
                      data-testid="text-pp-dollar-rate"
                    >
                      {dollarRateNum > 0 ? dollarRateNum.toFixed(2) : "—"}
                    </div>
                    {!dollarRateNum && date.trim() ? (
                      <div className="mt-1 text-xs text-red-600" data-testid="error-pp-dollar-rate-missing">
                        First set the Dollar Rate for this Date in the Dollar Rate tab.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="h-px bg-border" aria-hidden />

                <div className="flex items-center gap-2 text-sm font-semibold text-foreground" data-testid="text-processing-calculation-heading">
                  <CreditCard className="h-4 w-4 text-primary" /> Processing Calculation
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="grid-processing-calculation">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-processing-pct" data-testid="label-processing-pct">
                      Processing %
                    </Label>
                    <Input
                      id="pp-processing-pct"
                      inputMode="decimal"
                      value={processingPct}
                      onChange={(e) => setProcessingPct(e.target.value)}
                      placeholder="%"
                      className="mt-1 h-11"
                      data-testid="input-processing-pct"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" data-testid="label-processing-group">
                      Processing Group
                    </Label>
                    <Select value={processingGroupId} onValueChange={setProcessingGroupId}>
                      <SelectTrigger className="mt-1 h-11" data-testid="select-processing-group">
                        <SelectValue placeholder="Select Group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUPS.filter((g) => g.type === "processing").map((g) => (
                          <SelectItem key={g.id} value={g.id} data-testid={`option-processing-group-${g.id}`}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-processing-owner" data-testid="label-processing-owner">
                      Client
                    </Label>
                    <Input
                      id="pp-processing-owner"
                      value={selectedProcessingGroup?.clientName ?? ""}
                      readOnly
                      placeholder="Auto-filled..."
                      className="mt-1 h-11 bg-emerald-50"
                      data-testid="input-processing-owner"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-processing-total" data-testid="label-processing-total">
                      Processing Total (₹)
                    </Label>
                    <Input
                      id="pp-processing-total"
                      value={formatMoney(processingTotal, "")}
                      readOnly
                      className="mt-1 h-11 bg-muted/20"
                      data-testid="input-processing-total"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" aria-hidden />

                <div className="flex items-center gap-2 text-sm font-semibold text-foreground" data-testid="text-payment-group-calculation-heading">
                  <CreditCard className="h-4 w-4 text-primary" /> Payment Group Calculation
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="grid-payment-group-calculation">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-payment-group-pct" data-testid="label-payment-group-pct">
                      Payment Group %
                    </Label>
                    <Input
                      id="pp-payment-group-pct"
                      inputMode="decimal"
                      value={paymentGroupPct}
                      onChange={(e) => setPaymentGroupPct(e.target.value)}
                      placeholder="%"
                      className="mt-1 h-11"
                      data-testid="input-payment-group-pct"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" data-testid="label-payment-group">
                      Payment Group
                    </Label>
                    <Select value={paymentGroupId} onValueChange={setPaymentGroupId}>
                      <SelectTrigger className="mt-1 h-11" data-testid="select-payment-group">
                        <SelectValue placeholder="Select Group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUPS.filter((g) => g.type === "payment").map((g) => (
                          <SelectItem key={g.id} value={g.id} data-testid={`option-payment-group-${g.id}`}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-payment-owner" data-testid="label-payment-owner">
                      Name (Pay. Owner)
                    </Label>
                    <Input
                      id="pp-payment-owner"
                      value={selectedPaymentGroup?.clientName ?? ""}
                      readOnly
                      placeholder="Auto-filled..."
                      className="mt-1 h-11 bg-emerald-50"
                      data-testid="input-payment-owner"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="pp-payment-total" data-testid="label-payment-total">
                      Payment Total (₹)
                    </Label>
                    <Input
                      id="pp-payment-total"
                      value={formatMoney(paymentTotal, "")}
                      readOnly
                      className="mt-1 h-11 bg-muted/20"
                      data-testid="input-payment-total"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl"
                    disabled={!canSave}
                    data-testid="button-save-transaction"
                  >
                    Save Transaction
                  </Button>
                  {!canSave ? (
                    <div className="mt-2 text-xs text-muted-foreground" data-testid="text-save-hint">
                      Fill date, payment type, amount, dollar rate, processing group, and payment group to save.
                    </div>
                  ) : null}
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
